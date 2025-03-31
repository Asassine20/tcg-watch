import { json } from "@sveltejs/kit"
import type { RequestEvent } from "@sveltejs/kit"

/**
 * GET handler for /api/prices/sets
 * Returns all distinct sets for filtering
 */
export async function GET(event: RequestEvent) {
  try {
    // Check if the supabase client is properly initialized
    if (!event.locals.supabase) {
      console.error("Supabase client is not initialized")
      return json(
        { error: "Database connection not available" },
        { status: 500 },
      )
    }

    // Query for distinct sets
    const { data, error } = await event.locals.supabase
      .from("price_history")
      .select("group_id, set_name")
      .not("set_name", "is", null)
      .not("group_id", "is", null)
      // @ts-ignore (distinct is valid at runtime but missing in types)
      .distinct("group_id, set_name")
      .order("set_name")

    if (error) {
      console.error("Error fetching sets:", error)
      return json({ error: "Failed to fetch sets data" }, { status: 500 })
    }

    return json({
      sets: data || [],
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}
