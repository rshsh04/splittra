import { createClient } from "@/lib/supabase/client";

/**
 * Check if a user has a Stripe subscription id saved.
 * Returns an object with a boolean and the subscription id (or null).
 *
 * Usage:
 * const { hasSubscription } = await getUserSubscription(userId)
 */
export async function getUserSubscription(userId: number | string) {
  const supabase = createClient()

  if (userId === undefined || userId === null || userId === "") {
    return { hasPremium: false,  error: null }
  }

  const { data, error } = await supabase
    .from("users")
    .select("stripeSubscriptionId")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("getUserSubscription error:", error)
    return { hasPremium: false, subscriptionId: null, error }
  }

  const subscriptionId = data?.stripeSubscriptionId ?? null
  return { hasPremium: Boolean(subscriptionId),  error: null }
}