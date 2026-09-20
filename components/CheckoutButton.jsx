'use client';

import { useState } from 'react';

export default function CheckoutButton({ plan }) {
  // Track whether the Razorpay checkout is currently opening.
  const [loading, setLoading] = useState(false);

  // Start the Razorpay checkout process.
  const go = async () => {
    try {
      // Disable the button while checkout is being prepared.
      setLoading(true);

      // Create a Razorpay subscription through our backend API.
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
        }),
      });

      // Convert the API response into JSON.
      const data = await response.json();

      // Stop if our backend could not create the subscription.
      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to create subscription'
        );
      }
      
      // LOAD RAZORPAY CHECKOUT SCRIPT

      // If Razorpay Checkout is not already loaded,
      // load it dynamically in the browser.
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');

          script.src =
            'https://checkout.razorpay.com/v1/checkout.js';

          // Resolve when the Razorpay script loads successfully.
          script.onload = resolve;

          // Reject if the Razorpay script cannot be loaded.
          script.onerror = () => {
            reject(
              new Error('Failed to load Razorpay Checkout')
            );
          };

          // Add the script to the page.
          document.body.appendChild(script);
        });
      }

      // RAZORPAY CHECKOUT OPTIONS

      const options = {
        // Razorpay Test/Live key returned by our backend.
        key: data.keyId,

        // Subscription ID created by our backend.
        subscription_id: data.subscriptionId,

        // Name displayed inside Razorpay Checkout.
        name: 'GolfCircle',

        // Description depends on the selected subscription plan.
        description:
          plan === 'yearly'
            ? 'GolfCircle Yearly Subscription'
            : 'GolfCircle Monthly Subscription',

        // PAYMENT SUCCESS HANDLER

        handler: async function (paymentResponse) {
          try {
            // Send Razorpay payment details to our backend
            // so the payment signature can be verified securely.
            const verifyResponse = await fetch(
              '/api/razorpay/verify',
              {
                method: 'POST',

                headers: {
                  'Content-Type': 'application/json',
                },

                body: JSON.stringify({
                  // Razorpay payment ID.
                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,

                  // Razorpay subscription ID.
                  razorpay_subscription_id:
                    paymentResponse.razorpay_subscription_id,

                  // Razorpay signature used for verification.
                  razorpay_signature:
                    paymentResponse.razorpay_signature,

                  // Selected subscription plan.
                  plan,
                }),
              }
            );

            // Convert verification response to JSON.
            const verifyData = await verifyResponse.json();

            // Stop if payment verification failed.
            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.error ||
                'Payment verification failed'
              );
            }

            // Payment was successfully verified.
            alert(
              'Payment successful! Subscription activated.'
            );

            // Redirect the user to the dashboard.
            window.location.href = '/dashboard';
          } catch (error) {
            // Log verification errors for debugging.
            console.error(
              'Verification error:',
              error
            );

            // Show the error to the user.
            alert(
              error.message ||
              'Payment verification failed.'
            );

            // Re-enable the checkout button.
            setLoading(false);
          }
        },

        // RAZORPAY MODAL SETTINGS

        modal: {
          // Re-enable the button if the user closes
          // the Razorpay checkout without paying.
          ondismiss: function () {
            setLoading(false);
          },
        },

        // Customize the Razorpay checkout theme.
        theme: {
          color: '#111827',
        },
      };

      // CREATE RAZORPAY INSTANCE

      // Create the Razorpay checkout instance.
      const razorpay = new window.Razorpay(options);

      
      // PAYMENT FAILED HANDLER

      razorpay.on(
        'payment.failed',
        function (response) {
          // Get the error object safely.
          const paymentError = response?.error;

          // Log detailed Razorpay error information.
          // This is much more useful than simply logging
          // response.error because it shows exactly why
          // Razorpay rejected the payment.
          console.error(
            'Razorpay Payment Failed:',
            {
              code: paymentError?.code,
              description:
                paymentError?.description,
              reason: paymentError?.reason,
              source: paymentError?.source,
              step: paymentError?.step,

              // Keep the complete response available
              // for debugging if Razorpay sends extra data.
              rawResponse: response,
            }
          );

          // Show the most useful error message to the user.
          alert(
            paymentError?.description ||
            paymentError?.reason ||
            'Payment failed. Please try again.'
          );

          // Re-enable the checkout button.
          setLoading(false);
        }
      );

      // Finally open the Razorpay payment popup.
      razorpay.open();
    } catch (error) {
      // Handle errors that happen before Razorpay opens.
      console.error(
        'Checkout error:',
        error
      );

      // Show the checkout error to the user.
      alert(
        error.message ||
        'Checkout failed.'
      );

      // Re-enable the button.
      setLoading(false);
    }
  };

  // CHECKOUT BUTTON UI
  return (
    <button
      className="btn"
      onClick={go}
      disabled={loading}
    >
      {loading
        ? 'Opening checkout...'
        : plan === 'yearly'
          ? 'Start ₹199/year plan'
          : 'Start ₹19/month plan'}
    </button>
  );
}
