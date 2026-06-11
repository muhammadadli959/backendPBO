import express from "express";
import { Pool } from "pg";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function transformArtworkRow(row: any) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    artistName: row.artist_name,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    userId: row.user_id,
    categoryId: row.category_id,
    owner: row.owner,
    category: row.category,
  };
}

// GET /api/artworks
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.username as owner, c.name as category FROM artworks a
       JOIN users u ON a.user_id = u.id
       JOIN categories c ON a.category_id = c.id`,
    );
    res.json(result.rows.map(transformArtworkRow));
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error fetching artworks", error: err.message });
  }
});

// GET /api/artworks/:id
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.username as owner, c.name as category FROM artworks a
       JOIN users u ON a.user_id = u.id
       JOIN categories c ON a.category_id = c.id
       WHERE a.id = $1`,
      [req.params.id],
    );
    if (!result.rows[0])
      return res.status(404).json({ message: "Artwork not found" });
    res.json(transformArtworkRow(result.rows[0]));
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error fetching artwork", error: err.message });
  }
});

// POST /api/artworks (auth required)
router.post("/", authMiddleware, async (req, res) => {
  const { title, description, category, imageUrl, artistName } = req.body;
  const user = (req as any).user;
  if (!title || !category || !imageUrl)
    return res
      .status(400)
      .json({ message: "Title, category, and image URL are required" });
  try {
    let catRes = await pool.query("SELECT id FROM categories WHERE name = $1", [
      category,
    ]);
    if (!catRes.rows[0]) {
      const insertCat = await pool.query(
        "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id",
        [category],
      );
      if (insertCat.rows[0]) {
        catRes = insertCat;
      } else {
        catRes = await pool.query("SELECT id FROM categories WHERE name = $1", [
          category,
        ]);
      }
    }
    if (!catRes.rows[0])
      return res.status(500).json({ message: "Unable to resolve category" });
    const categoryId = catRes.rows[0].id;
    const result = await pool.query(
      `INSERT INTO artworks (title, description, image_url, artist_name, uploaded_by, uploaded_at, user_id, category_id)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7) RETURNING *`,
      [
        title,
        description,
        imageUrl,
        artistName || user.username,
        user.username,
        user.id,
        categoryId,
      ],
    );
    res.status(201).json(transformArtworkRow(result.rows[0]));
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error creating artwork", error: err.message });
  }
});

// PUT /api/artworks/:id (auth required)
router.put("/:id", authMiddleware, async (req, res) => {
  const { title, description, category } = req.body;
  const user = (req as any).user;
  try {
    // Only owner or admin can update
    const artRes = await pool.query("SELECT * FROM artworks WHERE id = $1", [
      req.params.id,
    ]);
    const artwork = artRes.rows[0];
    if (!artwork) return res.status(404).json({ message: "Artwork not found" });
    if (artwork.user_id !== user.id && user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    let catId = artwork.category_id;
    if (category) {
      const catRes = await pool.query(
        "SELECT id FROM categories WHERE name = $1",
        [category],
      );
      if (!catRes.rows[0])
        return res.status(400).json({ message: "Invalid category" });
      catId = catRes.rows[0].id;
    }
    const result = await pool.query(
      `UPDATE artworks SET title = $1, description = $2, category_id = $3 WHERE id = $4 RETURNING *`,
      [
        title || artwork.title,
        description || artwork.description,
        catId,
        req.params.id,
      ],
    );
    res.json(transformArtworkRow(result.rows[0]));
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error updating artwork", error: err.message });
  }
});

// DELETE /api/artworks/:id (auth required, admin or owner)
router.delete("/:id", authMiddleware, async (req, res) => {
  const user = (req as any).user;
  try {
    const artRes = await pool.query("SELECT * FROM artworks WHERE id = $1", [
      req.params.id,
    ]);
    const artwork = artRes.rows[0];
    if (!artwork) return res.status(404).json({ message: "Artwork not found" });
    if (artwork.user_id !== user.id && user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await pool.query("DELETE FROM artworks WHERE id = $1", [req.params.id]);
    res.json({ message: "Artwork deleted" });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error deleting artwork", error: err.message });
  }
});

export default router;
