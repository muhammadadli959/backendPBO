import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

// Load from parent directory
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("DATABASE_URL from env:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    console.log("🔍 Testing PostgreSQL Connection...");
    console.log(`Connection String: ${process.env.DATABASE_URL}`);

    // Test basic connection
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Connection successful!");
    console.log(`Server time: ${result.rows[0].now}`);

    // Check if database exists
    const dbCheck = await pool.query(
      "SELECT datname FROM pg_database WHERE datname = $1",
      ["PBO_db"],
    );
    if (dbCheck.rows.length > 0) {
      console.log("✅ Database 'PBO_db' exists");
    } else {
      console.log("❌ Database 'PBO_db' NOT found");
      return;
    }

    // Check tables
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log(`\n📊 Found ${tableCheck.rows.length} tables:`);
    tableCheck.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    // Check specific tables
    const requiredTables = [
      "users",
      "artworks",
      "categories",
      "ratings",
      "comments",
      "reports",
    ];
    console.log("\n🔍 Checking required tables:");
    for (const table of requiredTables) {
      const exists = tableCheck.rows.some((r) => r.table_name === table);
      console.log(`  ${exists ? "✅" : "❌"} ${table}`);
    }

    // Check user count
    const userCheck = await pool.query("SELECT COUNT(*) FROM users");
    console.log(`\n👤 Users in database: ${userCheck.rows[0].count}`);

    // Check artworks count
    const artworkCheck = await pool.query("SELECT COUNT(*) FROM artworks");
    console.log(`🎨 Artworks in database: ${artworkCheck.rows[0].count}`);
  } catch (err: any) {
    console.error("❌ Connection failed!");
    console.error(`Error: ${err.message}`);
    console.error(`Code: ${err.code}`);
  } finally {
    await pool.end();
    console.log("\n✅ Test completed and connection closed.");
  }
}

testConnection();
