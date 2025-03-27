import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// Get the directory name correctly in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const jsonFilePath = path.join(__dirname, "sv-prices-2025-03-26.json")
const sqlFilePath = path.join(__dirname, "../supabase/seed.sql")

try {
  console.log("Reading JSON file...")
  const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"))

  let sqlContent = `-- Auto-generated from ${path.basename(jsonFilePath)} on ${new Date().toISOString()}\n\n`

  sqlContent += "BEGIN;\n\n"

  console.log(`Processing ${jsonData.length} card groups...`)
  const currentDate = new Date().toISOString().split("T")[0]

  let totalProducts = 0

  jsonData.forEach((group) => {
    if (group.products && group.products.length > 0) {
      const subtypeCounts = {}
      group.products.forEach((product) => {
        const type = product.subTypeName
        subtypeCounts[type] = (subtypeCounts[type] || 0) + 1
      })

      sqlContent += `-- Products for ${group.name}: ${group.products.length} total\n`
      Object.entries(subtypeCounts).forEach(([type, count]) => {
        sqlContent += `-- ${type}: ${count}\n`
      })
      sqlContent += "\n"

      sqlContent += `-- Price history entries for ${group.name}\n`

      group.products.forEach((product, index) => {
        sqlContent += generatePriceHistoryRecord(
          group.categoryId,
          group.groupId,
          group.name,
          group.abbreviation || "",
          product,
          currentDate,
        )
        // }
        totalProducts++
      })
      sqlContent += "\n"
    }
  })

  // End transaction
  sqlContent += "COMMIT;\n"

  // Add summary comment at the end
  sqlContent += `\n-- Generated ${totalProducts} total product records\n`

  // Write SQL to file
  fs.writeFileSync(sqlFilePath, sqlContent)
  console.log(`SQL generated successfully at: ${sqlFilePath}`)
  console.log(`Generated price history for ${totalProducts} products`)
} catch (error) {
  console.error("Error processing JSON:", error)
}

function generatePriceHistoryRecord(
  categoryId,
  groupId,
  setName,
  abbreviation,
  product,
  currentDate,
) {
  const productId = product.productId
  const subTypeName = product.subTypeName
  const prevLowPrice = product.lowPrice
  const prevMidPrice = product.midPrice
  const prevHighPrice = product.highPrice
  const prevMarketPrice = product.marketPrice
  const prevDirectLowPrice = product.directLowPrice

  let sql = `INSERT INTO price_history (
    category_id,
    group_id,
    set_name,
    abbreviation,
    product_id,
    prev_low_price,
    prev_mid_price,
    prev_high_price,
    prev_market_price,
    prev_direct_low_price,
    sub_type_name,
    prev_date
  ) VALUES (
    ${categoryId},
    ${groupId},
    '${setName.replace(/'/g, "''")}',
    '${abbreviation.replace(/'/g, "''")}',
    ${productId},
    ${prevLowPrice},
    ${prevMidPrice},
    ${prevHighPrice},
    ${prevMarketPrice},
    ${prevDirectLowPrice},
    '${subTypeName.replace(/'/g, "''")}',
    '${currentDate}'
  );\n`

  return sql
}
