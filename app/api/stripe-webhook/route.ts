import Stripe from "stripe";
import { NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf);

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return new Response("Missing webhook secret", { status: 500 });
  if (!sig) return new Response("Missing stripe-signature header", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("❌ Stripe signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Hardcode premium days
  const PREMIUM_DAYS = 30;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email || session.customer_email;
      const subscriptionId = session.subscription as string | undefined;
      const customerId = session.customer as string;
      const subscription = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + PREMIUM_DAYS);
      const premiumUntil = expiresAt.toISOString();

      if (email) {
        await supabaseAdmin
          .from("users")
          .update({
            stripeSubscriptionId: subscriptionId || null,
            stripeCustomerId: customerId,
            premiumUntil,
            subscriptionStatus: subscriptionId ? "active" : "inactive",
          })
          .eq("email", email);

        console.log(`✅ Updated user ${email}: premiumUntil set to ${premiumUntil}`);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + PREMIUM_DAYS);
      const premiumUntil = subscription.status === "active" ? expiresAt.toISOString() : null;

      await supabaseAdmin
        .from("users")
        .update({
          stripeSubscriptionId: subscription.id,
          premiumUntil,
          subscriptionStatus: subscription.status === "active" ? "active" : "inactive",
        })
        .eq("stripeCustomerId", customerId);

      console.log(`✅ Updated user with customerId ${customerId}: premiumUntil=${premiumUntil}`);
      break;
    }

    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }

  return new Response("Success", { status: 200 });
}
