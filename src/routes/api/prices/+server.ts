import { json } from "@sveltejs/kit"
import type { RequestEvent } from "../../(marketing)/login/$types"

/**
 * GET handler for /api/prices
 * Returns all price history data with optional filtering
 */
export async function GET(event: RequestEvent) {
  try {
    const supabase = event.locals.supabase

    const groupId = Number(event.url.searchParams.get("groupId"))
    const categoryId = Number(event.url.searchParams.get("categoryId"))
    const limit = event.url.searchParams.get("limit") || 100

    let query = supabase
      .from("price_history")
      .select("*")
      .order("prev_date", { ascending: false })
      .limit(Number(limit))

    // Apply filters if provided
    if (groupId) {
      query = query.eq("group_id", groupId)
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching prices:", error)
      return json({ error: "Failed to fetch price data" }, { status: 500 })
    }

    return json({ data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}
