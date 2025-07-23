import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";

import authRoutes from "./routes/auth.js";
import foodRoutes from "./routes/food.js";

dotenv.config();
const app = express();

// Static uploads
app.use("/uploads", express.static("uploads"));

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// ✅ Allow both /api/auth/... and /api/... for login/register
app.use("/api/auth", authRoutes);  // eg. /api/auth/login


app.use("/api/food", foodRoutes);  // Food-related routes

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
