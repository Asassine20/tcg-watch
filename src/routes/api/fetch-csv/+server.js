import axios from "axios"
import { parse } from "csv-parse/sync"

export async function GET() {
  try {
    const csvUrl = "https://tcgcsv.com/tcgplayer/3/1450/ProductsAndPrices.csv" // replace with actual URL
    const response = await axios.get(csvUrl, { responseType: "text" })

    const records = parse(response.data, {
      columns: true,
      skip_empty_lines: true,
    })

    return new Response(
      JSON.stringify({
        message: "CSV fetched successfully",
        totalRecords: records.length,
        sampleRecords: records.slice(0, 5),
      }),
      { status: 200 },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    })
  }
}
