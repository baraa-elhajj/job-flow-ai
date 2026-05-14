import express from "express";
import { fetchHNHiringJobs, fetchParsedJobs, fetchParsedJobById, fetchLinkedInJobs, fetchLinkedInJobById } from "../controllers/jobsController.js";

const router = express.Router();

router.get("/hnhiring", fetchHNHiringJobs);
router.get("/parsed", fetchParsedJobs);
router.get("/parsed/:id", fetchParsedJobById);
router.get("/linkedin", fetchLinkedInJobs);
router.get("/linkedin/:id", fetchLinkedInJobById);

export default router;
