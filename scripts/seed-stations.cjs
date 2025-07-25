const { PrismaClient } = require("@prisma/client")
const fs = require("fs")
const path = require("path")

const prisma = new PrismaClient()

async function main() {
  try {
    const stationsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "stations.json"), "utf-8"))

    for (const station of stationsData) {
      await prisma.station.upsert({
        where: { id: station.id },
        update: {
          name: station.name,
          lat: station.lat,
          lng: station.lng,
          lines: station.lines,
        },
        create: {
          id: station.id,
          name: station.name,
          lat: station.lat,
          lng: station.lng,
          lines: station.lines,
        },
      })
    }

    console.log("Stations data seeded successfully")
  } catch (error) {
    console.error("Error seeding stations data:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

