import { db } from "../src/db/index.js"
//import { sql } from 'drizzle-orm'  Removed drizzle-orm import

async function testConnection() {
  try {
    console.log("Testing database connection...")
    const result = await db.query("SELECT NOW()") //Replaced drizzle-orm sql with standard query
    console.log("Database connection successful!")
    console.log("Current timestamp from database:", result.rows[0].now)

    // Test if tables exist
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)

    console.log("\nExisting tables:")
    tables.rows.forEach((table) => {
      console.log("-", table.table_name)
    })
  } catch (error) {
    console.error("Database connection failed:", error)
  }
}

testConnection()

