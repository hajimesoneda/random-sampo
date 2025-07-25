import pg from "pg"
const { Pool } = pg

// データベース接続プールの作成
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err)
  process.exit(-1)
})

console.log("Pool created. Attempting to connect...")
pool.connect((err, client, done) => {
  if (err) {
    console.error("Error connecting to the database", err.stack)
  } else {
    console.log("Successfully connected to the database")
    done()
  }
})

