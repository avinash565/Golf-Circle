import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Verify Razorpay payment and activate the user's subscription.
export async function POST(req) {
  try {
    // Read payment details sent from the Razorpay checkout.
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      plan,
    } = await req.json();

    // Make sure all required Razorpay verification values are present.
    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          error: 'Missing payment verification details.',
        },
        {
          status: 400,
        }
      );
    }

    // Create a server-side Supabase client.
    const supabase = await createClient();

    // Get the currently authenticated user.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Reject the request if no authenticated user is found.
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

    // Generate a HMAC SHA-256 signature using the
    // Razorpay secret key to verify payment authenticity.
    const generatedSignature = crypto
      .createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_payment_id}|${razorpay_subscription_id}`
      )
      .digest('hex');

    // Compare the generated signature with the signature
    // received from Razorpay.
    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        {
          error: 'Invalid payment signature.',
        },
        {
          status: 400,
        }
      );
    }

    // Save or update the user's subscription in Supabase.
    // The user_id is unique, so an existing subscription
    // will be updated instead of creating a duplicate.
    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: user.id,
          plan,
          status: 'active',
          razorpay_subscription_id:
            razorpay_subscription_id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    // Handle database errors.
    if (error) {
      console.error(
        'Supabase subscription error:',
        error
      );

      return NextResponse.json(
        {
          error: 'Failed to save subscription.',
        },
        {
          status: 500,
        }
      );
    }

    // Send a success response after payment verification
    // and subscription activation.
    return NextResponse.json({
      success: true,
      message: 'Subscription activated.',
    });
  } catch (error) {
    // Handle unexpected errors during verification.
    console.error(
      'Verification error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Payment verification failed.',
      },
      {
        status: 500,
      }
    );
  }
}