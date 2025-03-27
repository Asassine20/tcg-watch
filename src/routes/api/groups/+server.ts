import { json } from "@sveltejs/kit"
import { createClient } from "@supabase/supabase-js"

// Import your environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * GET handler for /api/groups
 * Returns all card groups or a specific group by ID
 */
export async function GET({
  url,
  params,
}: {
  url: URL
  params: Record<string, string>
}) {
  // Check if we're retrieving a specific group by ID
  if (params?.slug && !isNaN(Number(params.slug))) {
    return await getGroupById(parseInt(params.slug))
  }

  // Otherwise return list of groups with optional filtering
  try {
    const categoryId = url.searchParams.get("categoryId")

    let query = supabase
      .from("card_groups")
      .select("*")
      .order("published_on", { ascending: false })

    if (categoryId) {
      query = query.eq("category_id", categoryId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching groups:", error)
      return json({ error: "Failed to fetch group data" }, { status: 500 })
    }

    return json({ data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to get group by ID
async function getGroupById(groupId: number) {
  try {
    const { data, error } = await supabase
      .from("card_groups")
      .select(
        `
        *,
        price_history(*)
      `,
      )
      .eq("id", groupId)
      .single()

    if (error) {
      console.error("Error fetching group:", error)
      return json({ error: "Failed to fetch group data" }, { status: 500 })
    }

    return json({ data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}
