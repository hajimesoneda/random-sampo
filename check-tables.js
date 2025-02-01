import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function checkTables() {
  try {
    // Get all users
    console.log('\n--- Users Table ---');
    const usersResult = await pool.query('SELECT * FROM users');
    console.log('Users count:', usersResult.rows.length);
    console.log('Users:', usersResult.rows);

    // Get all visits
    console.log('\n--- Visits Table ---');
    const visitsResult = await pool.query('SELECT * FROM visits');
    console.log('Visits count:', visitsResult.rows.length);
    console.log('Visits:', visitsResult.rows);

    // Get all favorites
    console.log('\n--- Favorites Table ---');
    const favoritesResult = await pool.query('SELECT * FROM favorites');
    console.log('Favorites count:', favoritesResult.rows.length);
    console.log('Favorites:', favoritesResult.rows);

  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkTables();