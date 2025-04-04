#!/usr/bin/env node

import fetch from "node-fetch"
import fs from "fs/promises"
import path from "path"

// Configuration
const API_URL = "https://tcgcsv.com/tcgplayer/3/groups"
const OUTPUT_FILE = path.join(process.cwd(), "supabase/seed/sync_jobs_seed.sql")

async function fetchTCGGroups() {
  try {
    console.log(`Fetching data from ${API_URL}...`)
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Successfully fetched ${data.length} TCG groups.`)
    return data.results
  } catch (error) {
    console.error("Error fetching TCG groups:", error)
    throw error
  }
}

function generateSQLInserts(groups) {
  // SQL header with truncate statement
  let sql = `-- Generated SQL seed for sync_jobs table
-- Generated at: ${new Date().toISOString()}

-- Clear existing data
TRUNCATE TABLE sync_jobs RESTART IDENTITY;

-- Insert new data
INSERT INTO sync_jobs (category_id, group_id, name, abbreviation, published_on, status)
VALUES\n`

  // Generate insert statements for each group
  const values = groups.map((group) => {
    const groupId = group.groupId
    const name = group.name.replace(/'/g, "''") // Escape single quotes
    const abbreviation = group.abbreviation?.replace(/'/g, "''") || ""
    const publishedOn = group.publishedOn

    return `  (3, ${groupId}, '${name}', '${abbreviation}', '${publishedOn}', 'pending')`
  })

  // Join all values with commas and end with semicolon
  sql += values.join(",\n") + ";"

  return sql
}

async function saveToFile(sql) {
  try {
    // Ensure the directory exists
    const dir = path.dirname(OUTPUT_FILE)
    await fs.mkdir(dir, { recursive: true })

    // Write the SQL file
    await fs.writeFile(OUTPUT_FILE, sql)
    console.log(`SQL seed successfully written to ${OUTPUT_FILE}`)
  } catch (error) {
    console.error("Error saving SQL file:", error)
    throw error
  }
}

async function main() {
  try {
    // Fetch data from API
    const groups = await fetchTCGGroups()

    // Generate SQL statements
    const sql = generateSQLInserts(groups)

    // Save to file
    await saveToFile(sql)

    console.log("Process completed successfully!")
  } catch (error) {
    console.error("Process failed:", error)
    process.exit(1)
  }
}

// Run the main function
main()
