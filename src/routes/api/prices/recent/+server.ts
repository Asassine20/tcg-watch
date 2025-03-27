import { json } from "@sveltejs/kit"
import type { RequestEvent } from "@sveltejs/kit"

/**
 * GET handler for /api/prices/recent
 * Returns the 10 most recent price history entries
 */
export async function GET(event: RequestEvent) {
  console.log("Fetching recent prices...")
  try {
    // Check if the supabase client is properly initialized
    if (!event.locals.supabase) {
      console.error("Supabase client is not initialized")
      return json(
        { error: "Database connection not available" },
        { status: 500 },
      )
    }

    // Use the supabase client from event.locals
    const { data, error } = await event.locals.supabase
      .from("price_history")
      .select("*")
      .order("prev_date", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching recent prices:", error)
      return json(
        { error: "Failed to fetch recent price data" },
        { status: 500 },
      )
    }

    return json({ data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}
