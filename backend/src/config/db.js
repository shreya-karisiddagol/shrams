/**
 * PostgreSQL Connection Pool Configuration
 * Uses the `pg` library with environment-based settings
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'shrams_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Connection pool settings
  max: 20,                // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30s
  connectionTimeoutMillis: 2000, // Error if connection takes >2s
});

// Log successful pool connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

// Log pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err.message);
  process.exit(-1);
});

/**
 * Test the database connection on startup
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log(`🗄️  DB connected at: ${result.rows[0].now}`);
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
};

testConnection();

module.exports = pool;
