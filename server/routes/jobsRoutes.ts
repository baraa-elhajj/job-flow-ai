import express from "express";
import { fetchJobById, fetchJobs } from "../controllers/jobsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);
router.get("/", fetchJobs);
router.get("/:id", fetchJobById);

export default router;
