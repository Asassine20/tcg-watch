import { json } from "@sveltejs/kit"
import type { RequestEvent } from "@sveltejs/kit"

/**
 * GET handler for /api/prices/paginated
 * Returns paginated card data with filtering and sorting
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

    // Get query parameters
    const url = new URL(event.request.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20")
    const searchTerm = url.searchParams.get("search") || ""
    const selectedGroupId = Number(url.searchParams.get("set")) || null
    const sortColumn = url.searchParams.get("sort") || "market_price"
    const sortDirection = url.searchParams.get("dir") || "desc"
    const priceRange = url.searchParams.get("priceRange") || ""
    const productType = url.searchParams.get("type") || "card"

    console.warn(`Product type: ${productType}`)

    // Validate sort column to prevent SQL injection
    const validSortColumns = [
      "name",
      "set_name",
      "market_price",
      "prev_market_price",
      "diff_market_price",
      "dollar_diff_market_price",
      "updated_at",
    ]

    // Validate product type
    const validProductTypes = ["card", "sealed"]
    if (!validProductTypes.includes(productType)) {
      return json({ error: "Invalid product type" }, { status: 400 })
    }

    const actualSortColumn = validSortColumns.includes(sortColumn)
      ? sortColumn
      : "market_price"

    // Calculate pagination limits
    const fromIndex = (page - 1) * pageSize
    const toIndex = fromIndex + pageSize - 1

    // Build base query
    let query = event.locals.supabase
      .from("price_history")
      .select("*", { count: "exact" })

    // Apply filters
    query.eq("type", productType)

    if (searchTerm) {
      query = query.ilike("name", `%${searchTerm}%`)
    }

    if (selectedGroupId) {
      query = query.eq("group_id", selectedGroupId)
    }

    // Apply price range filter if provided
    if (priceRange) {
      if (priceRange === "0-5") {
        query = query.gte("market_price", 0).lt("market_price", 5)
      } else if (priceRange === "5-20") {
        query = query.gte("market_price", 5).lt("market_price", 20)
      } else if (priceRange === "20+") {
        query = query.gte("market_price", 20)
      }
    }

    // Add filtering for null values based on sort column
    if (
      ["market_price", "prev_market_price", "diff_market_price"].includes(
        actualSortColumn,
      ) &&
      sortDirection === "desc"
    ) {
      // When sorting by price in descending order, exclude null values
      query = query.not(actualSortColumn, "is", null)
    }

    // Get total count
    const { count: totalCount, error: countError } = await query

    if (countError) {
      console.error("Error counting records:", countError)
      return json({ error: "Failed to fetch cards count" }, { status: 500 })
    }

    // Apply sorting and pagination
    query = query
      .order(actualSortColumn, {
        ascending: sortDirection === "asc",
        nullsFirst: sortDirection === "asc",
      })
      .range(fromIndex, toIndex)

    // Execute query
    const { data: cards, error: fetchError } = await query

    if (fetchError) {
      console.error("Error fetching cards:", fetchError)
      return json({ error: "Failed to fetch cards data" }, { status: 500 })
    }

    return json({
      cards: cards || [],
      totalItems: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}
