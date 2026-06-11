import express from "express";
import { Pool } from "pg";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get user's saved artworks - MUST BE BEFORE /:artworkId routes
router.get("/user/saved", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;

    const result = await pool.query(
      `SELECT a.*, u.username as owner, c.name as category
       FROM artworks a
       JOIN saved_artworks sa ON a.id = sa.artwork_id
       JOIN users u ON a.user_id = u.id
       JOIN categories c ON a.category_id = c.id
       WHERE sa.user_id = $1
       ORDER BY sa.saved_at DESC`,
      [user.id]
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching saved artworks", error: err.message });
  }
});

// Check if artwork is saved by user
router.get("/:artworkId/is-saved", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { artworkId } = req.params;

    const result = await pool.query(
      `SELECT id FROM saved_artworks 
       WHERE user_id = $1 AND artwork_id = $2`,
      [user.id, artworkId]
    );

    res.json({ isSaved: result.rows.length > 0 });
  } catch (err: any) {
    res.status(500).json({ message: "Error checking save status", error: err.message });
  }
});

// Save artwork to user's collection
router.post("/:artworkId/save", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { artworkId } = req.params;

    const result = await pool.query(
      `INSERT INTO saved_artworks (user_id, artwork_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, artwork_id) DO NOTHING
       RETURNING id, saved_at`,
      [user.id, artworkId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Already saved" });
    }

    res.json({ message: "Artwork saved", data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ message: "Error saving artwork", error: err.message });
  }
});

// Unsave artwork
router.delete("/:artworkId/unsave", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { artworkId } = req.params;

    const result = await pool.query(
      `DELETE FROM saved_artworks 
       WHERE user_id = $1 AND artwork_id = $2
       RETURNING id`,
      [user.id, artworkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Save not found" });
    }

    res.json({ message: "Artwork removed from saved" });
  } catch (err: any) {
    res.status(500).json({ message: "Error unsaving artwork", error: err.message });
  }
});

export default router;

