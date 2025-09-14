import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { databases, Query } from '@/lib/appwrite';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' });

export async function POST(req: NextRequest) {
  // Example: Check the request URL to route logic
  if (req.nextUrl.pathname === '/api/stripe-webhook') {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      return new Response('Webhook Error', { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email;

      // Search for user in Appwrite DB by email
      const users = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
        [Query.equal('email', email as string)]
      );
      if (users.total > 0) {
        const userId = users.documents[0].$id;
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
          userId,
          {
            isPremium: true,
            premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // e.g., 1 month
          }
        );
      }
      return new Response('Success', { status: 200 });
    }
    return new Response('Unhandled event type', { status: 400 });
  }

  try {
    const origin = req.headers.get('origin') || '';
    const body = await req.json();
    const coupon = body.coupon || null;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1S6GqPGtQVm3XDhSzMghTEWT',
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard?success=true`,
      cancel_url: `${origin}/upgrade?canceled=true`,
      discounts: coupon ? [{ coupon }] : undefined,
    });
    return new Response(JSON.stringify({ id: session.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
