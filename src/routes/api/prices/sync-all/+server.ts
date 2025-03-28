import { json } from "@sveltejs/kit"
import type { RequestEvent } from "@sveltejs/kit"
import axios from "axios"

interface Group {
  groupId: number
  name: string
  abbreviation: string
  isSupplemental: boolean
  publishedOn: string
  modifiedOn: string
  categoryId: number
}

/**
 * GET handler for /api/prices/sync-all
 * Syncs price data for all available groups
 */
export async function GET(event: RequestEvent) {
  try {
    // Get the groups array from the request body
    const groups: Group[] = await axios
      .get("https://tcgcsv.com/tcgplayer/3/groups")
      .then((res) => {
        return res.data.results
      })

    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return json({ error: "Invalid groups data" }, { status: 400 })
    }

    console.log(`Syncing price data for ${groups.length} groups`)

    const results: {
      groupId: number
      name: string
      success: boolean
      result?: any
      error?: string
    }[] = []

    // Process each group sequentially to avoid overwhelming the API
    for (const group of groups) {
      try {
        // Call the sync endpoint for each group
        const response = await fetch(new URL(`/api/prices/sync`, event.url), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Forward authorization headers if needed
            ...event.request.headers,
          },
          body: JSON.stringify(group),
        })

        const result = await response.json()
        results.push({
          groupId: group.groupId,
          name: group.name,
          success: response.ok,
          result,
        })

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error processing group ${group.name}:`, error)
        results.push({
          groupId: group.groupId,
          name: group.name,
          success: false,
          error: String(error),
        })
      }
    }

    return json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("Unexpected error during bulk sync:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}
