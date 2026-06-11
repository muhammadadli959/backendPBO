import express from "express";
import { Pool } from "pg";
import { authMiddleware, requireRole } from "../middleware/authMiddleware";

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// POST /api/artworks/:id/reports
router.post("/:id/reports", authMiddleware, async (req, res) => {
  const { reason } = req.body;
  const user = (req as any).user;
  if (!reason) return res.status(400).json({ message: "Reason required" });
  try {
    await pool.query(
      `INSERT INTO reports (artwork_id, user_id, reason)
       VALUES ($1, $2, $3)`,
      [req.params.id, user.id, reason],
    );
    res.status(201).json({ message: "Report submitted" });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error submitting report", error: err.message });
  }
});

// GET /api/admin/reports (admin only)
router.get(
  "/admin/reports",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT r.*, a.title as artwork_title, u.username as reporter
       FROM reports r
       JOIN artworks a ON r.artwork_id = a.id
       JOIN users u ON r.user_id = u.id
       ORDER BY r.id ASC`,
      );
      res.json(result.rows);
    } catch (err: any) {
      res
        .status(500)
        .json({ message: "Error fetching reports", error: err.message });
    }
  },
);

// POST /api/admin/reports/:id/dismiss (admin only)
router.post(
  "/admin/reports/:id/dismiss",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      await pool.query("DELETE FROM reports WHERE id = $1", [req.params.id]);
      res.json({ message: "Report dismissed" });
    } catch (err: any) {
      res
        .status(500)
        .json({ message: "Error dismissing report", error: err.message });
    }
  },
);

// DELETE /api/admin/reports/:id/artworks/:artworkId (admin only)
router.delete(
  "/admin/reports/:id/artworks/:artworkId",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      await pool.query("DELETE FROM artworks WHERE id = $1", [
        req.params.artworkId,
      ]);
      await pool.query("DELETE FROM reports WHERE id = $1", [req.params.id]);
      res.json({ message: "Artwork and report deleted" });
    } catch (err: any) {
      res
        .status(500)
        .json({ message: "Error deleting artwork/report", error: err.message });
    }
  },
);

export default router;
