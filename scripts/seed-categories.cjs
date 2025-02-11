const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const predefinedCategories = [
  { id: "cafe", label: "カフェ", type: "cafe" },
  { id: "restaurant", label: "レストラン", type: "restaurant" },
  { id: "public_bath", label: "銭湯", type: "spa" },
  { id: "tourist_attraction", label: "観光スポット", type: "tourist_attraction" },
  { id: "park", label: "公園", type: "park" },
  { id: "museum", label: "美術館・博物館", type: "museum" },
  { id: "shopping_mall", label: "ショッピングモール", type: "shopping_mall" },
  { id: "amusement_park", label: "遊園地", type: "amusement_park" },
]

async function main() {
  console.log("Seeding predefined categories...")
  for (const category of predefinedCategories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    })
  }
  console.log("Seeding completed.")

  // Log all categories after seeding
  const allCategories = await prisma.category.findMany()
  console.log("All categories after seeding:", allCategories)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

