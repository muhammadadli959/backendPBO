"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
// POST /api/artworks/:id/ratings
router.post("/:id/ratings", authMiddleware_1.authMiddleware, async (req, res) => {
    const { rating } = req.body;
    const user = req.user;
    if (!rating || rating < 1 || rating > 5)
        return res.status(400).json({ message: "Rating 1-5 required" });
    try {
        // Insert or update rating (unique per artwork_id, user_id)
        await pool.query(`INSERT INTO ratings (artwork_id, user_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (artwork_id, user_id) DO UPDATE SET rating = $3`, [req.params.id, user.id, rating]);
        res.json({ message: "Rating submitted" });
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error submitting rating", error: err.message });
    }
});
// (Optional) GET /api/artworks/:id/ratings/summary
router.get("/:id/ratings/summary", async (req, res) => {
    try {
        const result = await pool.query(`SELECT COUNT(*) as count, AVG(rating)::numeric(2,1) as average
       FROM ratings WHERE artwork_id = $1`, [req.params.id]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error fetching rating summary", error: err.message });
    }
});
exports.default = router;
