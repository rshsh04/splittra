import Stripe from "stripe";
import { NextRequest } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_KEY!);

const databases = new Databases(client);

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
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
    console.error("Stripe signature verification failed", err);
    return new Response("Webhook Error", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email;

      let premiumDays = 30;
      let subscriptionId = session.subscription as string;

      // Check trial period
      if (session.mode === "subscription" && subscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          if (
            subscription.trial_end &&
            subscription.trial_end > Math.floor(Date.now() / 1000)
          ) {
            premiumDays = 14;
          }
        } catch (err) {
          console.error("Error fetching subscription", err);
        }
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + premiumDays);

      if (!email) {
        console.error("No email found in Stripe session");
        break;
      }

      try {
        const userQuery = await databases.listDocuments(
          process.env.APPWRITE_DATABASE!,
          process.env.APPWRITE_USERS_COLLECTION!,
          [Query.equal("email", email)]
        );

        if (userQuery.documents.length === 0) {
          console.error("No Appwrite user found with email:", email);
        } else {
          const userId = userQuery.documents[0].$id;

          await databases.updateDocument(
            process.env.APPWRITE_DATABASE!,
            process.env.APPWRITE_USERS_COLLECTION!,
            userId, // ✅ fixed
            {
              premiumUntil: expiresAt.toISOString(),
              stripeSubscriptionId: subscriptionId,
            }
          );
          console.log("✅ User upgraded to premium:", email);
        }
      } catch (err) {
        console.error("Error updating Appwrite user:", err);
      }
      break;
    }
    default:
      console.warn("Unhandled event type:", event.type);
      return new Response("Unhandled event type", { status: 400 });
  }

  return new Response("Success", { status: 200 });
}
