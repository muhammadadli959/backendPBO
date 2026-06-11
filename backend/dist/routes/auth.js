"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
// Register
router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ message: "Username and password required" });
    try {
        const hash = await bcrypt_1.default.hash(password, 10);
        const result = await pool.query("INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role", [username, hash, "user"]);
        res.status(201).json({ user: result.rows[0] });
    }
    catch (err) {
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
        if (!user)
            return res.status(401).json({ message: "Invalid credentials" });
        const valid = await bcrypt_1.default.compare(password, user.password_hash);
        if (!valid)
            return res.status(401).json({ message: "Invalid credentials" });
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ token, user: { username: user.username, role: user.role } });
    }
    catch (err) {
        res.status(500).json({ message: "Login error", error: err.message });
    }
});
exports.default = router;
