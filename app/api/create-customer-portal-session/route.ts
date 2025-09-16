import { NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
    }

    // Fetch the user from Supabase
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("stripeCustomerId, email")
      .eq("id", userId)
      .single();

    if (error || !user) {
      console.error("User not found:", error);
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    if (!user.stripeCustomerId) {
      return new Response(
        JSON.stringify({ error: "User does not have a Stripe customer ID" }),
        { status: 400 }
      );
    }

    // Create Stripe customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, // 👈 change if needed
    });

    return new Response(JSON.stringify({ url: portalSession.url }), { status: 200 });
  } catch (err) {
    console.error("Error creating portal session:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
