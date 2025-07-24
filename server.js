import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";
import fs from "fs";
import path from "path";
const router = express.Router();

import authRoutes from "./routes/auth.js";
import foodRoutes from "./routes/food.js";

dotenv.config();
const app = express();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("✅ Created uploads folder at:", uploadDir);
}
// Static uploads
app.use("/uploads", express.static("uploads"));

// Middleware


app.use(
  cors({
    origin: [
      "http://localhost:5173",             // ✅ allow local dev
      "https://dharani2812.github.io"      // ✅ allow GitHub Pages
    ], // your GitHub Pages frontend
    credentials: true, // only if using cookies or auth headers
  })
);

app.use(express.json());

// Connect DB
connectDB();

// ✅ Allow both /api/auth/... and /api/... for login/register
app.use("/api/auth", authRoutes);  // eg. /api/auth/login


app.use("/api/food", foodRoutes);  // Food-related routes

// ✅ Add this test route
app.get("/api/auth/test", (req, res) => {
  res.send("Auth route working ✅");
});

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
