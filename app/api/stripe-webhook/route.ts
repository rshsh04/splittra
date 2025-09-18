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
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email || session.customer_email;
      const subscriptionId = session.subscription as string | undefined;
      const customerId = session.customer as string;
      const mode = session.mode;
      
      if (!email) break;

      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("email", email)
        .single();

      if (!existingUser) break;

      let updateData: any = {
        stripeCustomerId: customerId,
      };

      if (mode === "subscription" && subscriptionId) {
        try {
          const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['subscription']
          });
          
          const subscription = expandedSession.subscription as Stripe.Subscription;
          
          updateData = {
            ...updateData,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
          };
        } catch (expandError) {
          // Handle error silently
        }
      } else if (mode === "payment") {
        updateData = {
          ...updateData,
          subscriptionStatus: "one_time_payment",
          lastPaymentDate: Math.floor(Date.now() / 1000),
        };
      }

      await supabaseAdmin
        .from("users")
        .update(updateData)
        .eq("email", email);
      break;
    }

    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      try {
        const expandedSubscription = await stripe.subscriptions.retrieve(subscription.id, {
          expand: ['customer']
        });
        
        const customer = expandedSubscription.customer as Stripe.Customer;
        const email = customer.email;
        
        if (!email) break;

        const { data: existingUser } = await supabaseAdmin
          .from("users")
          .select("id, email")
          .eq("email", email)
          .single();

        if (!existingUser) break;

        const updateData = {
          stripeCustomerId: customerId,
          stripeSubscriptionId: expandedSubscription.id,
          subscriptionStatus: expandedSubscription.status,
        };

        await supabaseAdmin
          .from("users")
          .update(updateData)
          .eq("email", email);
      } catch (error) {
        // Handle error silently
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      try {
        const expandedSubscription = await stripe.subscriptions.retrieve(subscription.id);
        
        const updateData = {
          stripeSubscriptionId: expandedSubscription.id,
          subscriptionStatus: expandedSubscription.status,
        };

        await supabaseAdmin
          .from("users")
          .update(updateData)
          .eq("stripeCustomerId", customerId);
      } catch (error) {
        // Handle error silently
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      const updateData = {
        stripeSubscriptionId: null,
        subscriptionStatus: "canceled",
      };

      await supabaseAdmin
        .from("users")
        .update(updateData)
        .eq("stripeCustomerId", customerId);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.billing_reason === "subscription_create" || invoice.billing_reason === "subscription_update") {
        try {
        
        } catch (error) {
          // Handle error silently
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
  
      break;
    }
  }

  return new Response("Success", { status: 200 });
}