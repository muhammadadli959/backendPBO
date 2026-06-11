import { Pool } from "pg";
import bcrypt from "bcrypt";

async function updateAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🔄 Updating admin credentials...");

    const newPassword = process.env.ADMIN_NEW_PASSWORD;
    if (!newPassword) {
      throw new Error("Missing ADMIN_NEW_PASSWORD in env");
    }
    const hash = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      "UPDATE users SET username = $1, password_hash = $2 WHERE username = $3 RETURNING id, username, role",
      ["AdMutCy", hash, "admin"],
    );

    if (result.rows.length > 0) {
      console.log("✅ Admin credentials updated successfully!");
      console.log(`New username: AdMutCy`);
      console.log(`New password: [set via ADMIN_NEW_PASSWORD]`);

      console.log(`User ID: ${result.rows[0].id}`);
    } else {
      console.log("❌ Admin user not found");
    }
  } catch (err: any) {
    console.error("❌ Error updating admin:", err.message);
  } finally {
    await pool.end();
  }
}

updateAdmin();
