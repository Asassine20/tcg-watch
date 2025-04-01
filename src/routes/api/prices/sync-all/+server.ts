import { json } from "@sveltejs/kit"
import type { RequestEvent } from "@sveltejs/kit"
import axios from "axios"

interface Group {
  groupId: number
  name: string
  abbreviation: string
  isSupplemental: boolean
  publishedOn: string | Date // ISO 8601 date string "2025-05-30T00:00:00" or Date object
  modifiedOn: string | Date // ISO 8601 date string "2025-05-30T00:00:00" or Date object
  categoryId: number
}

/**
 * GET handler for /api/prices/sync-all
 * Syncs price data for all available groups
 */
export async function GET(event: RequestEvent) {
  const startTime = Date.now()
  console.log("Starting bulk sync of price data...")
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
        // Skip groups published before 2020
        const publishedDate = new Date(group.publishedOn)
        const jan2020 = new Date("2020-01-01T00:00:00")

        if (publishedDate < jan2020) {
          console.log(`Skipping ${group.name} - published before 2020`)
          results.push({
            groupId: group.groupId,
            name: group.name,
            success: true,
            result: { skipped: true, reason: "Published before 2020" },
          })
          continue
        }

        // Call the sync endpoint for each group
        const response = await event.fetch(
          new URL(`/api/prices/sync`, event.url),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Forward authorization headers if needed
            },
            body: JSON.stringify(group),
          },
        )

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

    const secondsLapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.info(
      `Took ${secondsLapsed} seconds to process ${results.length} groups`,
    )

    return json({
      success: true,
      processed: results.length,
      timeTaken: `${((Date.now() - startTime) / 1000).toFixed(2)} seconds`, // Time taken in seconds
      message: `Bulk sync completed for ${results.length} groups.`,
      results: results,
    })
  } catch (error) {
    console.error("Unexpected error during bulk sync:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}
