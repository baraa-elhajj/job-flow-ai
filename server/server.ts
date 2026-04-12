import express from 'express';
import cors from 'cors';
import "dotenv/config";
import { connectDB } from './config/db.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize MongoDB connection
connectDB();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [FRONTEND_URL];
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));