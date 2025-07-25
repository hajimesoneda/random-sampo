const { drizzle } = require("drizzle-orm/node-postgres")
const { migrate } = require("drizzle-orm/node-postgres/migrator")
const { Pool } = require("pg")

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

const db = drizzle(pool)

async function main() {
  console.log("Running migrations...")
  await migrate(db, { migrationsFolder: "drizzle" })
  console.log("Migrations complete!")
  process.exit(0)
}

main().catch((err) => {
  console.error("Migration failed!", err)
  process.exit(1)
})

