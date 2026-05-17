import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import jobRoutes from "./routes/jobsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { startScraperScheduler } from "./services/jobScraperScheduler.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize MongoDB connection
connectDB();

startScraperScheduler();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = [FRONTEND_URL];
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK" });
});

app.use("/api/jobs", jobRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
