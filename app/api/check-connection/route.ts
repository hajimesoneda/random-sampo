import { NextResponse } from "next/server"
import { pool } from "@/src/db"

export async function GET() {
  try {
    const client = await pool.connect()

    // Get current database name
    const dbResult = await client.query("SELECT current_database()")
    const dbName = dbResult.rows[0].current_database

    // Get available tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    const tables = tablesResult.rows.map((row) => row.table_name)

    client.release()

    return NextResponse.json({
      success: true,
      dbName,
      tables,
    })
  } catch (error) {
    console.error("Error connecting to database:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to the database",
      },
      { status: 500 },
    )
  }
}

