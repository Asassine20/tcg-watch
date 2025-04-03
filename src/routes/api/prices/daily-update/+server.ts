import { json } from "@sveltejs/kit"
import type { RequestEvent } from "@sveltejs/kit"

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
 * GET handler for /api/prices/daily-update
 * Performs daily price updates for all products in the database
 */
export async function GET(event: RequestEvent) {
  try {
    console.log("Starting daily price update...")

    // Check if the supabase client is properly initialized
    if (!event.locals.supabase) {
      console.error("Supabase client is not initialized")
      return json(
        { error: "Database connection not available" },
        { status: 500 },
      )
    }

    const supabase = event.locals.supabase

    // 1. Get all distinct group IDs from the database using our SQL function
    const { data: groups, error: groupError } = await supabase.rpc(
      "get_distinct_group_ids",
    )

    if (groupError) {
      console.error("Error fetching group IDs:", groupError)
      return json(
        { error: "Failed to fetch group IDs", details: groupError },
        { status: 500 },
      )
    }

    if (!groups || groups.length === 0) {
      return json({ message: "No groups found in database" }, { status: 200 })
    }

    console.log(`Found ${groups.length} distinct groups to update`)

    const results = []
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

    // 2. Process each group
    for (const groupData of groups) {
      const groupId = groupData.group_id

      if (!groupId) {
        console.log("Skipping group with null group_id")
        continue
      }

      try {
        console.log(`Processing group ID: ${groupId}`)

        // 3. Fetch all products for this group using SQL function
        const { data: products, error: productsError } = await supabase.rpc(
          "get_products_by_group_id",
          { p_group_id: groupId },
        )

        if (productsError) {
          console.error(
            `Error fetching products for group ${groupId}:`,
            productsError,
          )
          results.push({
            groupId,
            success: false,
            error: productsError.message,
          })
          continue
        }

        if (!products || products.length === 0) {
          console.log(`No products found for group ${groupId}`)
          results.push({
            groupId,
            success: true,
            products: 0,
            message: "No products found for this group",
          })
          continue
        }

        // 4. Fetch current product and price data from external API
        const combinedData = await fetchCombinedProductData(groupId)

        if (!combinedData || combinedData.length === 0) {
          console.log(`No updated data found for group ${groupId}`)
          results.push({
            groupId,
            success: true,
            products: 0,
            message: "No updated data found for this group",
          })
          continue
        }

        // 5. Update each product with new prices
        let updatedCount = 0
        let missingCount = 0

        for (const product of products) {
          // Try to find matching product in our fetched data
          const combinedProduct = combinedData.find(
            (p) => p.productId === product.product_id,
          )

          if (!combinedProduct) {
            console.log(
              `No updated data found for product ID: ${product.product_id}`,
            )
            continue
          }

          // Find the matching price data (considering sub_type_name)
          const priceData = combinedProduct.prices.find(
            (price) =>
              price.subTypeName === product.sub_type_name ||
              (price.subTypeName === null && product.sub_type_name === null),
          )

          if (!priceData) {
            console.log(
              `No matching price data for product ID: ${product.product_id}, subType: ${product.sub_type_name || "null"}`,
            )
            continue
          }

          // Update product prices using SQL function
          const { data: updateResult, error: updateError } = await supabase.rpc(
            "update_product_prices",
            {
              p_id: product.id,
              p_product_id: product.product_id,
              p_new_low_price: priceData.lowPrice,
              p_new_mid_price: priceData.midPrice,
              p_new_high_price: priceData.highPrice,
              p_new_market_price: priceData.marketPrice,
              p_new_direct_low_price: priceData.directLowPrice,
              p_sub_type_name: priceData.subTypeName,
              p_prev_date: today,
            },
          )

          if (updateError) {
            console.error(
              `Error updating product ${product.product_id}:`,
              updateError,
            )
          } else if (updateResult) {
            updatedCount++
          } else {
            missingCount++
          }
        }

        results.push({
          groupId,
          success: true,
          totalProducts: products.length,
          updatedProducts: updatedCount,
          missingProducts: missingCount,
        })

        console.log(
          `Updated ${updatedCount}/${products.length} products for group ${groupId}`,
        )

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error processing group ${groupId}:`, error)
        results.push({
          groupId,
          success: false,
          error: String(error),
        })
      }
    }

    return json({
      success: true,
      date: today,
      totalGroups: groups.length,
      processedGroups: results.length,
      results,
    })
  } catch (error) {
    console.error("Unexpected error during daily price update:", error)
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
