import { json } from "@sveltejs/kit"
import { createClient } from "@supabase/supabase-js"

// Import your environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * GET handler for /api/groups/[slug]
 * Returns a specific group by ID
 */
export async function GET({ params }: { params: { slug: string } }) {
  if (!isNaN(Number(params.slug))) {
    try {
      const groupId = parseInt(params.slug)

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

  return json({ error: "Invalid group ID" }, { status: 400 })
}
