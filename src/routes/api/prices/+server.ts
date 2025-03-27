import { json } from "@sveltejs/kit"
import { createClient } from "@supabase/supabase-js"

// Import your environment variables for Supabase
// These should be defined in your .env file or environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * GET handler for /api/prices
 * Returns all price history data with optional filtering
 */
export async function GET({
  url,
  params,
}: {
  url: URL
  params: Record<string, string>
}) {
  try {
    // Check if this is a "recent" request
    if (params?.slug === "recent") {
      return await getRecentPrices()
    }

    const groupId = url.searchParams.get("groupId")
    const categoryId = url.searchParams.get("categoryId")
    const limit = url.searchParams.get("limit") || 100

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

// Helper function for recent prices
async function getRecentPrices() {
  try {
    const { data, error } = await supabase
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
