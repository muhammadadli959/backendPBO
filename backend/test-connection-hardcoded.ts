import { Pool } from "pg";

async function testConnection() {
  const pool = new Pool({
    user: "Backend_User",
    password: "HDPJKW1819JT",
    host: "localhost",
    port: 5432,
    database: "PBO_db",
  });

  try {
    console.log("🔍 Testing PostgreSQL Connection...");
    console.log("Host: localhost:5432");
    console.log("Database: PBO_db");
    console.log("User: Backend_User");

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
    try {
      const userCheck = await pool.query("SELECT COUNT(*) FROM users");
      console.log(`\n👤 Users in database: ${userCheck.rows[0].count}`);
    } catch (e: any) {
      console.log(`\n👤 Users table error: ${e.message}`);
    }

    // Check artworks count
    try {
      const artworkCheck = await pool.query("SELECT COUNT(*) FROM artworks");
      console.log(`🎨 Artworks in database: ${artworkCheck.rows[0].count}`);
    } catch (e: any) {
      console.log(`🎨 Artworks table error: ${e.message}`);
    }
  } catch (err: any) {
    console.error("❌ Connection failed!");
    console.error(`Error: ${err.message}`);
    console.error(`Code: ${err.code}`);
  } finally {
    await pool.end();
    console.log("\n✅ Test completed.");
  }
}

testConnection();
