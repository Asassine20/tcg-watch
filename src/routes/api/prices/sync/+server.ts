import { json } from "@sveltejs/kit"
import type { RequestEvent } from "@sveltejs/kit"

interface Group {
  groupId: number
  name: string
  abbreviation: string
  isSupplemental: boolean
  publishedOn: string | Date
  modifiedOn: string | Date
  categoryId: number
}

interface ProductData {
  productId: number
  name: string
  cleanName: string
  imageUrl: string
  url: string
  categoryId: number
  groupId: number
}

interface PriceData {
  productId: number
  lowPrice: number | null
  midPrice: number | null
  highPrice: number | null
  marketPrice: number | null
  directLowPrice: number | null
  subTypeName: string | null
}

interface CombinedProductData extends ProductData {
  prices: PriceData[]
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

    // Fetch combined product and price data for the group
    const combinedData = await fetchCombinedProductData(group.groupId)

    if (!combinedData || combinedData.length === 0) {
      console.log(`No data found for group: ${group.name}`)
      return json({ message: "No data found for group" }, { status: 200 })
    }

    console.log(
      `Found ${combinedData.length} products for group: ${group.name}`,
    )

    // Current date for the price records
    const currentDate = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

    // Prepare data for insertion - each product might have multiple price records based on subTypeName
    const priceRecords = []

    for (const product of combinedData) {
      if (product.prices.length === 0) {
        // If no price data, create a single record with null prices
        priceRecords.push({
          category_id: group.categoryId,
          group_id: group.groupId,
          set_name: group.name,
          abbreviation: group.abbreviation,
          product_id: product.productId,
          name: product.name,
          clean_name: product.cleanName,
          image_url: product.imageUrl,
          url: product.url,
          low_price: null,
          mid_price: null,
          high_price: null,
          market_price: null,
          direct_low_price: null,
          sub_type_name: null,
          prev_date: currentDate,
        })
      } else {
        // Create a record for each price variant (different subTypeName)
        for (const price of product.prices) {
          priceRecords.push({
            category_id: group.categoryId,
            group_id: group.groupId,
            set_name: group.name,
            abbreviation: group.abbreviation,
            product_id: product.productId,
            name: product.name,
            clean_name: product.cleanName,
            image_url: product.imageUrl,
            url: product.url,
            low_price: price.lowPrice,
            mid_price: price.midPrice,
            high_price: price.highPrice,
            market_price: price.marketPrice,
            direct_low_price: price.directLowPrice,
            sub_type_name: price.subTypeName,
            prev_date: currentDate,
          })
        }
      }
    }

    // Insert the data into the price_history table
    const { data, error } = await event.locals.supabase
      .from("price_history")
      .upsert(priceRecords, {
        onConflict: "product_id,sub_type_name",
        ignoreDuplicates: false,
      })
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
      message: `Processed ${priceRecords.length} price records for ${group.name}`,
      data,
    })
  } catch (error) {
    console.error("Unexpected error during price sync:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Fetches both product and price data and combines them
 */
async function fetchCombinedProductData(
  groupId: number,
): Promise<CombinedProductData[]> {
  try {
    // 1. Fetch products data
    const productsUrl = `https://tcgcsv.com/tcgplayer/3/${groupId}/products`
    console.log(`Fetching products from: ${productsUrl}`)

    const productsResponse = await fetch(productsUrl)

    if (!productsResponse.ok) {
      throw new Error(
        `Failed to fetch products: ${productsResponse.statusText}`,
      )
    }

    const productsData = await productsResponse.json()

    if (!productsData.results || !Array.isArray(productsData.results)) {
      throw new Error(`Invalid products API response format`)
    }

    // 2. Fetch price data
    const pricesUrl = `https://tcgcsv.com/tcgplayer/3/${groupId}/prices`
    console.log(`Fetching prices from: ${pricesUrl}`)

    const pricesResponse = await fetch(pricesUrl)

    if (!pricesResponse.ok) {
      throw new Error(`Failed to fetch prices: ${pricesResponse.statusText}`)
    }

    const pricesData = await pricesResponse.json()

    if (!pricesData.results || !Array.isArray(pricesData.results)) {
      throw new Error(`Invalid prices API response format`)
    }

    // 3. Create a map to group prices by product ID
    const pricesByProductId = new Map<number, PriceData[]>()

    pricesData.results.forEach((price: PriceData) => {
      if (!pricesByProductId.has(price.productId)) {
        pricesByProductId.set(price.productId, [])
      }
      pricesByProductId.get(price.productId)!.push(price)
    })

    // 4. Combine product and price data
    return productsData.results.map((product: any) => {
      const productId = product.productId || product.id

      return {
        productId,
        name: product.name || "",
        cleanName: product.cleanName || product.name || "",
        imageUrl: product.imageUrl || "",
        url: product.url || "",
        categoryId: product.categoryId || null,
        groupId,
        prices: pricesByProductId.get(productId) || [],
      }
    })
  } catch (error) {
    console.error(`Error fetching data for group ${groupId}:`, error)
    return []
  }
}
