import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET() {
  try {
    // Test database connection
    const result = await sql`SELECT NOW()`
    console.log("Database connection test result:", result)

    // Test if stations table exists and has data
    const stationsCount = await sql`SELECT COUNT(*) FROM stations`
    console.log("Stations count:", stationsCount)

    return NextResponse.json({
      status: "Connected successfully",
      timestamp: result[0]?.now,
      stationsCount: stationsCount[0]?.count,
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      {
        status: "Connection failed",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

