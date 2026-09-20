// app/api/draw/route.js

// Supabase server client.
// Used to get the currently logged-in user.
import { createClient } from '@/lib/supabase/server';

// Admin/service-role client.
// Used for operations that require admin privileges.
import { adminClient } from '@/lib/supabase/admin';

// Draw helper functions.
import {
  randomNumbers,
  weightedNumbers,
  prizeSplit,
} from '@/lib/draw';

// Next.js response helper.
import { NextResponse } from 'next/server';




export async function POST(req) {
  try {

    // 1. CHECK LOGGED-IN USER
    // Create the normal Supabase server client.
    const s = await createClient();

    // Get the currently authenticated user.
    const {
      data: { user },
    } = await s.auth.getUser();

    // If nobody is logged in, stop the request.
    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      );
    }

    // 2. CHECK ADMIN ROLE
    // Get the user's profile from Supabase.
    const {
      data: profile,
      error: profileError,
    } = await s
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Handle profile lookup error.
    if (profileError) {
      console.error(
        'Profile fetch error:',
        profileError
      );

      return NextResponse.json(
        {
          error: profileError.message,
        },
        {
          status: 500,
        }
      );
    }

    // Only admins are allowed to run a draw.
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Forbidden. Admin access required.',
        },
        {
          status: 403,
        }
      );
    }

    // 3. CREATE ADMIN CLIENT
    // Service-role client for admin database operations.
    const a = adminClient();

    // 4. GET ACTIVE SUBSCRIBERS
    const {
      data: subscriptions,
      error: subscriptionError,
    } = await a
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active');

    // Handle subscription lookup error.
    if (subscriptionError) {
      console.error(
        'Subscription fetch error:',
        subscriptionError
      );

      return NextResponse.json(
        {
          error: subscriptionError.message,
        },
        {
          status: 500,
        }
      );
    }

    // Extract user IDs from active subscriptions.
    const activeUserIds =
      subscriptions?.map(
        (sub) => sub.user_id
      ) || [];


    // At least one active subscriber is required.
    if (activeUserIds.length === 0) {
      return NextResponse.json(
        {
          error:
            'No active subscribers found. At least one active subscriber is required to run a draw.',
        },
        {
          status: 400,
        }
      );
    }

    // 5. GET USERS' SCORES
    const {
      data: allScores,
      error: scoreError,
    } = await a
      .from('scores')
      .select('user_id, score, date')
      .in('user_id', activeUserIds)
      .order('date', {
        ascending: false,
      });

    // Handle score lookup error.
    if (scoreError) {
      console.error(
        'Score fetch error:',
        scoreError
      );

      return NextResponse.json(
        {
          error: scoreError.message,
        },
        {
          status: 500,
        }
      );
    }

    // 6. KEEP ONLY LATEST 5 SCORES PER USER
    const userScores = new Map();

    // Scores are already sorted newest → oldest.
    // Therefore, the first 5 scores for each user
    // are their latest 5 scores.
    for (const row of allScores || []) {

      // Create an empty array for a new user.
      if (!userScores.has(row.user_id)) {
        userScores.set(
          row.user_id,
          []
        );
      }

      // Get this user's score array.
      const scores =
        userScores.get(row.user_id);

      // Keep only 5 scores.
      if (scores.length < 5) {
        scores.push(
          Number(row.score)
        );
      }
    }

    // 7. FIND ELIGIBLE USERS
    const eligibleUsers = [];

    // Check every active subscriber.
    for (const userId of activeUserIds) {

      // Get their latest scores.
      const scores =
        userScores.get(userId) || [];

      // PRD requires 5 scores to participate.
      if (scores.length >= 5) {
        eligibleUsers.push({
          userId,
          scores,
        });
      }
    }


    // No eligible users means the draw cannot run.
    if (eligibleUsers.length === 0) {
      return NextResponse.json(
        {
          error:
            'No eligible subscribers found. Active subscribers must have 5 scores before participating in the draw.',
        },
        {
          status: 400,
        }
      );
    }

    // 8. CHECK PREVIOUS DRAW FOR JACKPOT ROLLOVER
    const {
      data: previousDraw,
    } = await a
      .from('draws')
      .select(
        'id, prize_pool, draw_date'
      )
      .eq('status', 'published')
      .order('draw_date', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();


    // Default rollover amount.
    let jackpotRollover = 0;


    // If a previous draw exists,
    // check whether it had a 5-number winner.
    if (previousDraw) {

      const {
        data: previousFiveWinners,
      } = await a
        .from('winners')
        .select('id')
        .eq(
          'draw_id',
          previousDraw.id
        )
        .eq(
          'match_type',
          5
        );


      // 40% of the previous prize pool
      // belongs to the 5-number jackpot.
      const previousJackpot =
        Number(
          previousDraw.prize_pool || 0
        ) * 0.4;


      // If there was no 5-number winner,
      // roll the jackpot into this draw.
      if (
        (!previousFiveWinners ||
          previousFiveWinners.length === 0) &&
        previousJackpot > 0
      ) {
        jackpotRollover =
          previousJackpot;
      }
    }



    // 9. GENERATE DRAW NUMBERS
    // Current project logic uses a random draw.
    const method = 'random';

    // Generate 5 random numbers.
    const numbers =
      randomNumbers(5);

    // 10. CREATE BASE PRIZE POOL

    // Current project logic:
    // ₹10 contribution per active subscriber.
    // IMPORTANT:
    // The PRD does not specify the exact amount.
    // This ₹10 value is project-specific logic.
    const basePool =
      activeUserIds.length * 10;


    // Calculate the 40/35/25 prize split.
    const basePrizes =
      prizeSplit(basePool);


    // Add previous jackpot rollover
    // to the 5-number prize.
    const prizes = {
      five:
        basePrizes.five +
        jackpotRollover,

      four:
        basePrizes.four,

      three:
        basePrizes.three,
    };

    // 11. CREATE DRAW RECORD
    const {
      data: draw,
      error: drawError,
    } = await a
      .from('draws')
      .insert({
        draw_date:
          new Date().toISOString(),

        numbers,

        method,

        prize_pool:
          basePool,

        status: 'published',
      })
      .select()
      .single();


    // Handle draw creation error.
    if (drawError) {
      console.error(
        'Draw creation error:',
        drawError
      );

      return NextResponse.json(
        {
          error:
            drawError.message,
        },
        {
          status: 500,
        }
      );
    }


    // 12. FIND WINNERS
    // Store winners according to their tier.
    const winnersByTier = {
      five: [],
      four: [],
      three: [],
    };


    // Check every eligible subscriber.
    for (const participant of eligibleUsers) {

      // Find how many of their 5 scores
      // match the drawn numbers.
      const matchedNumbers =
        participant.scores.filter(
          (score) =>
            numbers.includes(score)
        );


      // Count matched numbers.
      const matchCount =
        matchedNumbers.length;


      // Highest matching tier only.
      if (matchCount === 5) {

        winnersByTier.five.push(
          participant.userId
        );

      } else if (matchCount === 4) {

        winnersByTier.four.push(
          participant.userId
        );

      } else if (matchCount === 3) {

        winnersByTier.three.push(
          participant.userId
        );
      }
    }

    // 13. CREATE WINNER DATABASE ROWS
    const winnerRows = [];


    // 5-NUMBER WINNERS
    if (
      winnersByTier.five.length > 0
    ) {

      // Split the 5-number prize equally.
      const prizePerWinner =
        prizes.five /
        winnersByTier.five.length;


      // Create one winner row per user.
      for (
        const userId of
        winnersByTier.five
      ) {

        winnerRows.push({
          draw_id: draw.id,

          user_id: userId,

          match_type: 5,

          prize_amount:
            Number(
              prizePerWinner.toFixed(2)
            ),

          payment_status:
            'pending',
        });
      }
    }

    // 4-NUMBER WINNERS
    if (
      winnersByTier.four.length > 0
    ) {

      // Split the 4-number prize equally.
      const prizePerWinner =
        prizes.four /
        winnersByTier.four.length;


      // Create one winner row per user.
      for (
        const userId of
        winnersByTier.four
      ) {

        winnerRows.push({
          draw_id: draw.id,

          user_id: userId,

          match_type: 4,

          prize_amount:
            Number(
              prizePerWinner.toFixed(2)
            ),

          payment_status:
            'pending',
        });
      }
    }


    // 3-NUMBER WINNERS
    if (
      winnersByTier.three.length > 0
    ) {

      // Split the 3-number prize equally.
      const prizePerWinner =
        prizes.three /
        winnersByTier.three.length;


      // Create one winner row per user.
      for (
        const userId of
        winnersByTier.three
      ) {

        winnerRows.push({
          draw_id: draw.id,

          user_id: userId,

          match_type: 3,

          prize_amount:
            Number(
              prizePerWinner.toFixed(2)
            ),

          payment_status:
            'pending',
        });
      }
    }



    // 14. INSERT WINNERS INTO DATABASE
    if (winnerRows.length > 0) {

      const {
        error: winnerError,
      } = await a
        .from('winners')
        .insert(winnerRows);


      // Handle winner insertion error.
      if (winnerError) {

        console.error(
          'Winner insertion error:',
          winnerError
        );

        return NextResponse.json(
          {
            error:
              winnerError.message,

            draw,
          },
          {
            status: 500,
          }
        );
      }
    }



    // 15. SEND SUCCESS RESPONSE
    return NextResponse.json({
      success: true,

      draw,

      numbers,

      method,

      activeSubscribers:
        activeUserIds.length,

      eligibleUsers:
        eligibleUsers.length,

      prizes,

      jackpotRollover,

      winners: {
        five:
          winnersByTier.five.length,

        four:
          winnersByTier.four.length,

        three:
          winnersByTier.three.length,

        total:
          winnerRows.length,
      },
    });


  } catch (error) {

    // 16. HANDLE UNEXPECTED ERROR
    console.error(
      'DRAW ERROR:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Something went wrong while running the draw.',
      },
      {
        status: 500,
      }
    );
  }
}