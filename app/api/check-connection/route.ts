import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    // Execute a simple query to check the connection
    const result = await db.execute(sql`SELECT 1 as connected`)

    if (result[0]?.connected === 1) {
      return NextResponse.json({ status: "Connected successfully" })
    } else {
      throw new Error("Unexpected query result")
    }
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json({ status: "Connection failed", error: error.message }, { status: 500 })
  }
}

