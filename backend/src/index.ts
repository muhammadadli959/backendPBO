import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import artworksRoutes from "./routes/artworks";
import ratingsRoutes from "./routes/ratings";
import commentsRoutes from "./routes/comments";
import reportsRoutes from "./routes/reports";
import savedRoutes from "./routes/saved";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
const allowedOrigins = [
  "http://localhost:5173",      
  "https://project-uas-pbo.vercel.app"
];

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.options("*", cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Backend API is running", version: "1.0.0" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/artworks", artworksRoutes);
app.use("/api/artworks", ratingsRoutes);
app.use("/api/artworks", commentsRoutes);
app.use("/api/artworks", savedRoutes);
app.use("/api", reportsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

// Export for Vercel serverless
export default app;

// Start server locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  });
}
