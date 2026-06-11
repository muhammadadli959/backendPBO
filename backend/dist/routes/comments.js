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
// POST /api/artworks/:id/comments
router.post("/:id/comments", authMiddleware_1.authMiddleware, async (req, res) => {
    const { content } = req.body;
    const user = req.user;
    if (!content)
        return res.status(400).json({ message: "Content required" });
    try {
        await pool.query(`INSERT INTO comments (artwork_id, user_id, content)
       VALUES ($1, $2, $3)`, [req.params.id, user.id, content]);
        res.status(201).json({ message: "Comment added" });
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error adding comment", error: err.message });
    }
});
// GET /api/artworks/:id/comments
router.get("/:id/comments", async (req, res) => {
    try {
        const result = await pool.query(`SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.artwork_id = $1 ORDER BY c.id ASC`, [req.params.id]);
        res.json(result.rows);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error fetching comments", error: err.message });
    }
});
// DELETE /api/comments/:id (user or admin)
router.delete("/comments/:id", authMiddleware_1.authMiddleware, async (req, res) => {
    const user = req.user;
    try {
        const result = await pool.query("SELECT * FROM comments WHERE id = $1", [
            req.params.id,
        ]);
        const comment = result.rows[0];
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });
        if (comment.user_id !== user.id && user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }
        await pool.query("DELETE FROM comments WHERE id = $1", [req.params.id]);
        res.json({ message: "Comment deleted" });
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error deleting comment", error: err.message });
    }
});
exports.default = router;
