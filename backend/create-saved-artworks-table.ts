import { Pool } from "pg";

async function createSavedArtworksTable() {
  const pool = new Pool({
    user: "Backend_User",
    password: "HDPJKW1819JT",
    host: "localhost",
    port: 5432,
    database: "PBO_db",
  });

  try {
    console.log("🔄 Creating saved_artworks table...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_artworks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        artwork_id INTEGER NOT NULL,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
        UNIQUE(user_id, artwork_id)
      );
    `);

    // Create index untuk faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_saved_artworks_user_id 
      ON saved_artworks(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_saved_artworks_artwork_id 
      ON saved_artworks(artwork_id);
    `);

    console.log("✅ Table saved_artworks created successfully!");

    // Verify table
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'saved_artworks'
    `);

    console.log("\n📋 Table Structure:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

  } catch (err: any) {
    console.error("❌ Error creating table:", err.message);
  } finally {
    await pool.end();
  }
}

createSavedArtworksTable();
