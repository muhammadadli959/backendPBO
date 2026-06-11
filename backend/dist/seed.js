"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/seed.ts
const pg_1 = require("pg");
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
async function seed() {
    // Hash passwords
    const adminPassword = await bcrypt_1.default.hash("AdMutCy24260612", 10);
    const userPassword = await bcrypt_1.default.hash("user123", 10);
    // Insert admin
    await pool.query(`
    INSERT INTO users (username, password_hash, role)
    SELECT $1, $2, 'admin'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = $1);
  `, ["AdMutCy", adminPassword]);
    // Insert user
    await pool.query(`
    INSERT INTO users (username, password_hash, role)
    SELECT $1, $2, 'user'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = $1);
  `, ["user1", userPassword]);
    // Insert categories
    const categories = [
        "Digital Art",
        "Traditional",
        "Photography",
        "3D",
        "Other",
    ];
    for (const name of categories) {
        await pool.query(`INSERT INTO categories (name)
       SELECT $1
       WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = $1);`, [name]);
    }
    // Insert artworks
    const artworks = [
        {
            title: "Sunset",
            description: "A beautiful sunset.",
            user: "admin",
            category: "Digital Art",
        },
        {
            title: "Mountain",
            description: "A tall mountain.",
            user: "user1",
            category: "Photography",
        },
    ];
    for (const art of artworks) {
        await pool.query(`INSERT INTO artworks (title, description, user_id, category_id)
       SELECT $1, $2, u.id, c.id
       FROM users u, categories c
       WHERE u.username = $3 AND c.name = $4
         AND NOT EXISTS (
           SELECT 1 FROM artworks WHERE title = $1
         );`, [art.title, art.description, art.user, art.category]);
    }
    // Insert ratings
    await pool.query(`
    INSERT INTO ratings (artwork_id, user_id, rating)
    SELECT a.id, u.id, 5
    FROM artworks a, users u
    WHERE a.title = 'Sunset' AND u.username = 'user1'
      AND NOT EXISTS (
        SELECT 1 FROM ratings r WHERE r.artwork_id = a.id AND r.user_id = u.id
      );
  `);
    // Insert comments
    await pool.query(`
    INSERT INTO comments (artwork_id, user_id, content)
    SELECT a.id, u.id, 'Amazing artwork!'
    FROM artworks a, users u
    WHERE a.title = 'Sunset' AND u.username = 'user1'
      AND NOT EXISTS (
        SELECT 1 FROM comments c
        WHERE c.artwork_id = a.id AND c.user_id = u.id AND c.content = 'Amazing artwork!'
      );
  `);
    // Reports table left empty
    console.log("Seeding selesai!");
    await pool.end();
}
seed().catch((err) => {
    console.error("Seed error:", err);
    pool.end();
});
