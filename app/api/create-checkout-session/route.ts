import { NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' });

export async function POST(req: NextRequest) {
  // Only handle Stripe checkout session creation

  try {
    const origin = req.headers.get('origin') || '';
    const { coupon, userId, email } = await req.json();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1S7O1fGUKaK460WZqxrbK8Gv',
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      subscription_data: {
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
        trial_period_days: 14,
        metadata: {
          userId: userId || '',
        },
      },
      mode: 'subscription',
      success_url: `${origin}/dashboard?success=true`,
      cancel_url: `${origin}/upgrade?canceled=true`,
      allow_promotion_codes: true,
      discounts: coupon ? [{ coupon }] : [],
    });
    return Response.json({ id: session.id });
  } catch (error) {
    return Response.json({ error: (error as Error).message || 'Unknown error' }, { status: 500 });
  }
}
