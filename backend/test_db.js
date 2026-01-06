import pool from './db.js';

async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log("✅ Database Connected Successfully!");
    console.log("Current Time from DB:", res.rows[0].now);
    
    const tableCheck = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log("Existing Tables:", tableCheck.rows.map(t => t.tablename));
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Database Connection Failed:", err.message);
    process.exit(1);
  }
}

test();