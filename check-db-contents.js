import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

console.log('Environment variables:', process.env);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function checkDatabaseContents() {
  try {
    console.log('Database URL:', process.env.DATABASE_URL);

    // Check current database
    const dbResult = await pool.query('SELECT current_database()');
    console.log('\nCurrent database:', dbResult.rows[0].current_database);

    // Check tables
    const tables = ['users', 'visits', 'favorites'];
    for (const table of tables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`\n${table} table:`);
        console.log(`- Row count: ${countResult.rows[0].count}`);

        if (parseInt(countResult.rows[0].count) > 0) {
          const contentResult = await pool.query(`SELECT * FROM ${table} LIMIT 5`);
          console.log(`- Sample data (up to 5 rows):`);
          console.log(contentResult.rows);
        }
      } catch (error) {
        console.log(`Error querying ${table} table:`, error.message);
      }
    }

  } catch (error) {
    console.error('Error checking database contents:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseContents();