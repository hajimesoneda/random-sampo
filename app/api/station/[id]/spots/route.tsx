import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const stationId = params.id
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categories = categoriesParam ? JSON.parse(categoriesParam) : []

  try {
    // Fetch spots for the station (you may need to adjust this based on your data structure)
    const spots = await fetchSpots(stationId, categories)

    return NextResponse.json({ spots })
  } catch (error) {
    console.error("Error fetching spots:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

async function fetchSpots(stationId: string, categories: string[]) {
  // Implement spot fetching logic here
  // This is a placeholder and should be replaced with actual spot fetching logic
  return []
}

