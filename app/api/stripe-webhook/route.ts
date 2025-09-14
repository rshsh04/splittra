import Stripe from 'stripe';
import { NextRequest } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' });

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook Error', { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      console.log('Checkout session completed:', event.data.object);
      // Extract user email from Stripe session
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email || session.customer_email;

      // Determine premium duration
      let premiumDays = 30;
      // Stripe Checkout Session does not have trial_end, need to fetch subscription if present
      if (session.mode === 'subscription' && session.subscription) {
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          if (subscription.trial_end && subscription.trial_end > Math.floor(Date.now() / 1000)) {
            premiumDays = 14;
          }
        } catch (err) {
          console.error('Error fetching Stripe subscription:', err);
        }
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + premiumDays);

      // Update user in Appwrite users collection
      // (Assuming you have Appwrite client setup in lib/appwrite.ts)
      const { databases } = await import('@/lib/appwrite');
      const USERS_COLLECTION_ID = 'users';
      try {
        // Query user by email
        const userQuery = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          USERS_COLLECTION_ID,
          [
            // Appwrite Query.equal
            `email=${email}`
          ]
        );
        if (userQuery.documents.length > 0) {
          const userId = userQuery.documents[0].$id;
          await databases.updateDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            USERS_COLLECTION_ID,
            userId,
            {
              isPremium: true,
              premiumExpiresAt: expiresAt.toISOString(),
            }
          );
        }
      } catch (err) {
        console.error('Error updating user premium status:', err);
      }
      break;
    }
    default:
      // Unexpected event type
      return new Response('Unhandled event type', { status: 400 });
  }

  return new Response('Success', { status: 200 });
}
