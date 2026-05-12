import express from "express";
import { fetchHNHiringJobs, fetchParsedJobs, fetchParsedJobById } from "../controllers/jobsController.js";

const router = express.Router();

router.get("/hnhiring", fetchHNHiringJobs);
router.get("/parsed", fetchParsedJobs);
router.get("/parsed/:id", fetchParsedJobById);

export default router;
