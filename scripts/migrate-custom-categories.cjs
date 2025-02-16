const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function migrateCustomCategories() {
  try {
    const preferences = await prisma.categoryPreference.findMany({
      where: {
        customCategories: {
          not: null,
        },
      },
    })

    for (const pref of preferences) {
      const customCategories = JSON.parse(pref.customCategories)
      const migratedCategories = customCategories.map((cat) => ({
        id: cat.label,
        label: cat.label,
        type: cat.type,
      }))

      await prisma.categoryPreference.update({
        where: { id: pref.id },
        data: {
          customCategories: JSON.stringify(migratedCategories),
        },
      })
    }

    console.log("Custom categories migration completed successfully")
  } catch (error) {
    console.error("Error migrating custom categories:", error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateCustomCategories()

