import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import dotenv from "dotenv";
import type { Secret, SignOptions } from "jsonwebtoken";

dotenv.config();
const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role",
      [username, hash, "user"],
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err: any) {
    if (err.code === "23505")
      return res.status(409).json({ message: "Username already exists" });
    res.status(500).json({ message: "Register error", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET as Secret,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions,
    );
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
});

export default router;
