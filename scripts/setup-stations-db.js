import { db } from "../src/db"
import { sql } from "drizzle-orm"
import fs from "fs/promises"
import path from "path"

async function setupStationsDatabase() {
  console.log("Setting up stations database...")

  try {
    // Create stations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        lines TEXT[] NOT NULL
      )
    `)
    console.log("Stations table created or already exists")

    // Read the stations data from the JSON file
    const stationsData = JSON.parse(await fs.readFile(path.join(process.cwd(), "data", "stations.json"), "utf-8"))

    // Insert stations data
    for (const station of stationsData) {
      await db.execute(sql`
        INSERT INTO stations (id, name, lat, lng, lines)
        VALUES (${station.id}, ${station.name}, ${station.lat}, ${station.lng}, ${station.lines})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          lines = EXCLUDED.lines
      `)
    }
    console.log(`Inserted or updated ${stationsData.length} stations`)

    console.log("Stations database setup completed successfully!")
  } catch (error) {
    console.error("Error setting up stations database:", error)
    throw error
  }
}

setupStationsDatabase()

