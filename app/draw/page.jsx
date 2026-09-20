import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import {
  randomNumbers,
  weightedNumbers,
  prizeSplit,
} from '@/lib/draw';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // --------------------------------------------------
    // 1. CHECK ADMIN
    // --------------------------------------------------

    const s = await createClient();

    const {
      data: { user },
    } = await s.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile } = await s
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    // Admin/service-role client
    const a = adminClient();

    // --------------------------------------------------
    // 2. GET ACTIVE SUBSCRIBERS
    // --------------------------------------------------

    const { data: subscriptions, error: subscriptionError } =
      await a
        .from('subscriptions')
        .select('user_id')
        .eq('status', 'active');

    if (subscriptionError) {
      console.error(
        'Subscription fetch error:',
        subscriptionError
      );

      return NextResponse.json(
        { error: subscriptionError.message },
        { status: 500 }
      );
    }

    const activeUserIds =
      subscriptions?.map((sub) => sub.user_id) || [];

    if (activeUserIds.length === 0) {
      return NextResponse.json(
        {
          error:
            'No active subscribers found. At least one active subscriber is required to run a draw.',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. GET USERS' SCORES
    // --------------------------------------------------

    const { data: allScores, error: scoreError } =
      await a
        .from('scores')
        .select('user_id, score, date')
        .in('user_id', activeUserIds)
        .order('date', { ascending: false });

    if (scoreError) {
      console.error('Score fetch error:', scoreError);

      return NextResponse.json(
        { error: scoreError.message },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 4. KEEP ONLY LATEST 5 SCORES PER USER
    // --------------------------------------------------

    const userScores = new Map();

    for (const row of allScores || []) {
      if (!userScores.has(row.user_id)) {
        userScores.set(row.user_id, []);
      }

      const scores = userScores.get(row.user_id);

      if (scores.length < 5) {
        scores.push(Number(row.score));
      }
    }

    // --------------------------------------------------
    // 5. CHECK THAT USERS HAVE 5 SCORES
    // --------------------------------------------------

    const eligibleUsers = [];

    for (const userId of activeUserIds) {
      const scores = userScores.get(userId) || [];

      if (scores.length >= 5) {
        eligibleUsers.push({
          userId,
          scores,
        });
      }
    }

    if (eligibleUsers.length === 0) {
      return NextResponse.json(
        {
          error:
            'No eligible subscribers found. Active subscribers must have 5 scores before participating in the draw.',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. GET PREVIOUS DRAW FOR JACKPOT ROLLOVER
    // --------------------------------------------------

    const { data: previousDraw } = await a
      .from('draws')
      .select('id, prize_pool, draw_date')
      .eq('status', 'published')
      .order('draw_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    let jackpotRollover = 0;

    if (previousDraw) {
      const { data: previousFiveWinners } = await a
        .from('winners')
        .select('id')
        .eq('draw_id', previousDraw.id)
        .eq('match_type', 5);

      const previousJackpot =
        Number(previousDraw.prize_pool || 0) * 0.4;

      if (
        (!previousFiveWinners ||
          previousFiveWinners.length === 0) &&
        previousJackpot > 0
      ) {
        jackpotRollover = previousJackpot;
      }
    }

    // --------------------------------------------------
    // 7. CREATE DRAW NUMBERS
    // --------------------------------------------------
    //
    // Current admin button runs a RANDOM draw.
    // PRD allows Random OR Algorithmic.
    //

    const method = 'random';

    const numbers = randomNumbers(5);

    // --------------------------------------------------
    // 8. CREATE BASE PRIZE POOL
    // --------------------------------------------------
    //
    // Current project logic:
    // ₹10 contribution per active subscriber.
    //
    // Note:
    // The PRD requires a fixed portion of each
    // subscription to contribute to the prize pool,
    // but it does NOT specify the exact amount.
    //

    const basePool = activeUserIds.length * 10;

    const basePrizes = prizeSplit(basePool);

    // 5-number jackpot receives rollover if applicable.
    const prizes = {
      five: basePrizes.five + jackpotRollover,
      four: basePrizes.four,
      three: basePrizes.three,
    };

    // --------------------------------------------------
    // 9. CREATE DRAW RECORD
    // --------------------------------------------------

    const { data: draw, error: drawError } = await a
      .from('draws')
      .insert({
        draw_date: new Date().toISOString(),
        numbers,
        method,
        prize_pool: basePool,
        status: 'published',
      })
      .select()
      .single();

    if (drawError) {
      console.error('Draw creation error:', drawError);

      return NextResponse.json(
        { error: drawError.message },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 10. FIND WINNERS
    // --------------------------------------------------

    const winnersByTier = {
      five: [],
      four: [],
      three: [],
    };

    for (const participant of eligibleUsers) {
      const matchedNumbers = participant.scores.filter(
        (score) => numbers.includes(score)
      );

      const matchCount = matchedNumbers.length;

      // Highest matching tier only.
      if (matchCount === 5) {
        winnersByTier.five.push(participant.userId);
      } else if (matchCount === 4) {
        winnersByTier.four.push(participant.userId);
      } else if (matchCount === 3) {
        winnersByTier.three.push(participant.userId);
      }
    }

    // --------------------------------------------------
    // 11. CALCULATE EQUAL PRIZE PER WINNER
    // --------------------------------------------------

    const winnerRows = [];

    // 5-number winners
    if (winnersByTier.five.length > 0) {
      const prizePerWinner =
        prizes.five / winnersByTier.five.length;

      for (const userId of winnersByTier.five) {
        winnerRows.push({
          draw_id: draw.id,
          user_id: userId,
          match_type: 5,
          prize_amount: Number(prizePerWinner.toFixed(2)),
          payment_status: 'pending',
        });
      }
    }

    // 4-number winners
    if (winnersByTier.four.length > 0) {
      const prizePerWinner =
        prizes.four / winnersByTier.four.length;

      for (const userId of winnersByTier.four) {
        winnerRows.push({
          draw_id: draw.id,
          user_id: userId,
          match_type: 4,
          prize_amount: Number(prizePerWinner.toFixed(2)),
          payment_status: 'pending',
        });
      }
    }

    // 3-number winners
    if (winnersByTier.three.length > 0) {
      const prizePerWinner =
        prizes.three / winnersByTier.three.length;

      for (const userId of winnersByTier.three) {
        winnerRows.push({
          draw_id: draw.id,
          user_id: userId,
          match_type: 3,
          prize_amount: Number(prizePerWinner.toFixed(2)),
          payment_status: 'pending',
        });
      }
    }

    // --------------------------------------------------
    // 12. INSERT WINNERS INTO DATABASE
    // --------------------------------------------------

    if (winnerRows.length > 0) {
      const { error: winnerError } = await a
        .from('winners')
        .insert(winnerRows);

      if (winnerError) {
        console.error(
          'Winner insertion error:',
          winnerError
        );

        return NextResponse.json(
          {
            error: winnerError.message,
            draw,
          },
          { status: 500 }
        );
      }
    }

    // --------------------------------------------------
    // 13. RESPONSE
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      draw,

      numbers,

      method,

      activeSubscribers: activeUserIds.length,

      eligibleUsers: eligibleUsers.length,

      prizes,

      jackpotRollover,

      winners: {
        five: winnersByTier.five.length,
        four: winnersByTier.four.length,
        three: winnersByTier.three.length,
        total: winnerRows.length,
      },
    });
  } catch (error) {
    console.error('DRAW ERROR:', error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Something went wrong while running the draw.',
      },
      { status: 500 }
    );
  }
}
