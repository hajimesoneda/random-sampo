import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function checkConnection() {
  try {
    // データベース接続テスト
    const client = await pool.connect();
    
    // 現在のデータベース名を取得
    const result = await client.query('SELECT current_database()');
    const dbName = result.rows[0].current_database;
    console.log('Successfully connected to database:', dbName);
    
    // スキーマ情報を取得
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nAvailable tables:');
    tables.rows.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

    client.release();
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await pool.end();
  }
}

checkConnection();