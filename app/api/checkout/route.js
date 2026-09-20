import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req) {
  try {
    // Supabase client
    const supabase = await createClient();

    // Get logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized. Please login first.',
        },
        { status: 401 }
      );
    }

    // Read request body
    const { plan } = await req.json();

    // Validate plan
    if (plan !== 'monthly' && plan !== 'yearly') {
      return NextResponse.json(
        {
          error: 'Invalid plan selected.',
        },
        { status: 400 }
      );
    }

    // Razorpay client
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Select Razorpay plan
    const planId =
      plan === 'monthly'
        ? process.env.RAZORPAY_MONTHLY_PLAN_ID
        : process.env.RAZORPAY_YEARLY_PLAN_ID;

    if (!planId) {
      return NextResponse.json(
        {
          error: 'Razorpay plan ID is not configured.',
        },
        { status: 500 }
      );
    }

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,

      // For demo/testing:
      // monthly = 12 billing cycles
      // yearly = 1 billing cycle
      total_count: plan === 'monthly' ? 12 : 1,

      customer_notify: 1,

      notes: {
        user_id: user.id,
        plan: plan,
        email: user.email || '',
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
    });
  } catch (error) {
    console.error('RAZORPAY CHECKOUT ERROR:', error);

    return NextResponse.json(
      {
        error: error?.message || 'Checkout failed.',
      },
      { status: 500 }
    );
  }
}
