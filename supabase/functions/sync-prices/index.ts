// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

Deno.serve(async (req) => {
  try {
    // Check for OPTIONS request
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      })
    }

    // Extract groupId from the request body
    const { groupId, categoryId, name, abbreviation } = await req.json()

    if (!groupId) {
      return new Response(JSON.stringify({ error: "Missing groupId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    )

    // Fetch combined product and price data for the group
    const combinedData = await fetchCombinedProductData(groupId)

    if (!combinedData || combinedData.length === 0) {
      console.log(`No data found for group: ${groupId}`)
      return new Response(
        JSON.stringify({ message: "No data found for group" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    console.log(`Found ${combinedData.length} products for group: ${groupId}`)

    // Current date for the price records
    const currentDate = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

    // Prepare data for insertion - each product might have multiple price records based on subTypeName
    const priceRecords = []

    for (const product of combinedData) {
      if (product.prices.length === 0) {
        // If no price data, create a single record with null prices
        priceRecords.push({
          category_id: categoryId,
          group_id: groupId,
          set_name: name,
          abbreviation: abbreviation,
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
          type: product.type,
        })
      } else {
        // Create a record for each price variant (different subTypeName)
        for (const price of product.prices) {
          priceRecords.push({
            category_id: categoryId,
            group_id: groupId,
            set_name: name,
            abbreviation: abbreviation,
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
            type: product.type,
          })
        }
      }
    }

    // Call the upsert_price_history function for each record
    const results = []

    for (const record of priceRecords) {
      const { data, error } = await supabase.rpc("upsert_price_history", {
        p_category_id: record.category_id,
        p_group_id: record.group_id,
        p_set_name: record.set_name,
        p_abbreviation: record.abbreviation,
        p_product_id: record.product_id,
        p_name: record.name,
        p_clean_name: record.clean_name,
        p_image_url: record.image_url,
        p_url: record.url,
        p_low_price: record.low_price,
        p_mid_price: record.mid_price,
        p_high_price: record.high_price,
        p_market_price: record.market_price,
        p_direct_low_price: record.direct_low_price,
        p_sub_type_name: record.sub_type_name,
        p_type: record.type,
      })

      if (error) {
        console.error("Error upserting record:", error)
        throw error
      }

      results.push(data)
    }

    // Retrieve updated records for verification
    const productIds = priceRecords.map((record) => record.product_id)
    const subTypeNames = priceRecords.map((record) => record.sub_type_name)

    const updatedRecords = []
    const chunkSize = 50 // Adjust the chunk size as needed

    for (let i = 0; i < productIds.length; i += chunkSize) {
      const productIdsChunk = productIds.slice(i, i + chunkSize)
      const subTypeNamesChunk = subTypeNames.slice(i, i + chunkSize)

      const { data: recordsChunk, error: selectError } = await supabase
        .from("price_history")
        .select()
        .in("product_id", productIdsChunk)
        .in("sub_type_name", subTypeNamesChunk)

      if (selectError) {
        console.error("Error retrieving updated records:", selectError)
        throw selectError
      }

      updatedRecords.push(...recordsChunk)
    }

    // Return the response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully updated ${priceRecords.length} records`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    )
  } catch (error) {
    console.error("Unexpected error during price sync:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

interface ExtendedData {
  name: string
  displayName: string
  value: string
}

interface ProductData {
  productId: number
  name: string
  cleanName: string
  imageUrl: string
  url: string
  categoryId: number
  groupId: number
  type: string
}

interface ProductResponse extends ProductData {
  id: number
  extendedData?: ExtendedData[]
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
    return productsData.results.map((product: ProductResponse) => {
      const productId = product.productId || product.id

      let type = "sealed"

      if (product.extendedData) {
        const extendedData = product.extendedData as ExtendedData[]
        const typeData = extendedData.find((data) => data.name === "Number")

        if (typeData) {
          type = "card"
        }
      }

      return {
        productId,
        name: product.name || "",
        cleanName: product.cleanName || product.name || "",
        imageUrl: product.imageUrl || "",
        url: product.url || "",
        categoryId: product.categoryId || null,
        groupId,
        prices: pricesByProductId.get(productId) || [],
        type,
      }
    })
  } catch (error) {
    console.error(`Error fetching data for group ${groupId}:`, error)
    return []
  }
}
