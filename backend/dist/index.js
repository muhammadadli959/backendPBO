"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const artworks_1 = __importDefault(require("./routes/artworks"));
const ratings_1 = __importDefault(require("./routes/ratings"));
const comments_1 = __importDefault(require("./routes/comments"));
const reports_1 = __importDefault(require("./routes/reports"));
const saved_1 = __importDefault(require("./routes/saved"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express_1.default.json());
// Health check endpoint
app.get("/", (req, res) => {
    res.json({ message: "Backend API is running", version: "1.0.0" });
});
// API Routes
app.use("/api/auth", auth_1.default);
app.use("/api/artworks", artworks_1.default);
app.use("/api/artworks", ratings_1.default);
app.use("/api/artworks", comments_1.default);
app.use("/api/artworks", saved_1.default);
app.use("/api", reports_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Endpoint not found" });
});
// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
});
// Export for Vercel serverless
exports.default = app;
// Start server locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    });
}
