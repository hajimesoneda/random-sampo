import { pool } from "../src/db/pool.js";
import { users, visits, favorites } from "../src/db/schema.js";

async function setupDatabase() {
  try {
    // テーブルの作成
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        station_id TEXT NOT NULL,
        station_name TEXT NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        weather TEXT,
        memo TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        station_id TEXT NOT NULL,
        station_name TEXT NOT NULL
      )
    `);

    console.log("Database setup completed successfully");
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    await pool.end();
  }
}

setupDatabase();

