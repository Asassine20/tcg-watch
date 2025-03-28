import { json } from "@sveltejs/kit"
import type { RequestEvent } from "@sveltejs/kit"

interface Group {
  groupId: number
  name: string
  abbreviation: string
  isSupplemental: boolean
  publishedOn: string | Date // ISO 8601 date string "2025-05-30T00:00:00" or Date object
  modifiedOn: string | Date  // ISO 8601 date string "2025-05-30T00:00:00" or Date object
  categoryId: number
}

interface Product {
  productId: number
  name: string
  cleanName: string
  price: number
  imageUrl: string
  categoryId: number
  groupId: number
  url: string
}

/**
 * POST handler for /api/prices/sync
 * Fetches card information for a group and inserts it into the price_history table
 */
export async function POST(event: RequestEvent) {
  try {
    // Check if the supabase client is properly initialized
    if (!event.locals.supabase) {
      console.error("Supabase client is not initialized")
      return json(
        { error: "Database connection not available" },
        { status: 500 },
      )
    }

    // Get the group data from the request body
    const group: Group = await event.request.json()

    if (!group || !group.groupId) {
      return json({ error: "Invalid group data" }, { status: 400 })
    }

    console.log(
      `Syncing price data for group: ${group.name} (${group.groupId})`,
    )

    // Fetch products for the group
    const products = await fetchProductsForGroup(group.groupId)

    if (!products || products.length === 0) {
      console.log(`No products found for group: ${group.name}`)
      return json({ message: "No products found for group" }, { status: 200 })
    }

    console.log(`Found ${products.length} products for group: ${group.name}`)

    // Current date for the price records
    const currentDate = new Date().toISOString()

    // Prepare data for insertion
    const priceRecords = products.map((product) => ({
      category_id: group.categoryId,
      group_id: group.groupId,
      set_name: group.name,
      abbreviation: group.abbreviation,
      product_id: product.productId,
      name: product.name,
      clean_name: product.cleanName,
      image_url: product.imageUrl,
      url: product.url,
    }))

    // Insert the data into the price_history table
    const { data, error } = await event.locals.supabase
      .from("price_history")
      .insert(priceRecords)
      .select()

    if (error) {
      console.error("Error inserting price records:", error)
      return json(
        { error: "Failed to insert price records", details: error },
        { status: 500 },
      )
    }

    return json({
      success: true,
      message: `Inserted ${priceRecords.length} price records for ${group.name}`,
      data,
    })
  } catch (error) {
    console.error("Unexpected error during price sync:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Fetch products for a specific group from the TCG API
 */
async function fetchProductsForGroup(groupId: number): Promise<Product[]> {
  try {
    const url = `https://tcgcsv.com/tcgplayer/3/${groupId}/products`
    console.log(`Fetching products from: ${url}`)

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`)
    }

    console.log(response)

    const data = await response.json()

    console.log(data)
    return data.results.map((item: any) => ({
      productId: item.productId || item.id,
      name: item.name || item.title,
      price: parseFloat(item.price || item.marketPrice || "0"),
      // Map other fields as needed
    }))
  } catch (error) {
    console.error(`Error fetching products for group ${groupId}:`, error)
    return []
  }
}
