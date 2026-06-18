import express from "express";
import { fetchJobById, fetchJobs } from "../controllers/jobsController.js";

const router = express.Router();

router.get("/", fetchJobs);
router.get("/:id", fetchJobById);

export default router;
