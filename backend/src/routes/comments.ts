import express from "express";
import { Pool } from "pg";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// POST /api/artworks/:id/comments
router.post("/:id/comments", authMiddleware, async (req, res) => {
  const { content } = req.body;
  const user = (req as any).user;
  if (!content) return res.status(400).json({ message: "Content required" });
  try {
    await pool.query(
      `INSERT INTO comments (artwork_id, user_id, content)
       VALUES ($1, $2, $3)`,
      [req.params.id, user.id, content],
    );
    res.status(201).json({ message: "Comment added" });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error adding comment", error: err.message });
  }
});

// GET /api/artworks/:id/comments
router.get("/:id/comments", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.artwork_id = $1 ORDER BY c.id ASC`,
      [req.params.id],
    );
    res.json(result.rows);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error fetching comments", error: err.message });
  }
});

// DELETE /api/comments/:id (user or admin)
router.delete("/comments/:id", authMiddleware, async (req, res) => {
  const user = (req as any).user;
  try {
    const result = await pool.query("SELECT * FROM comments WHERE id = $1", [
      req.params.id,
    ]);
    const comment = result.rows[0];
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.user_id !== user.id && user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await pool.query("DELETE FROM comments WHERE id = $1", [req.params.id]);
    res.json({ message: "Comment deleted" });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error deleting comment", error: err.message });
  }
});

export default router;
