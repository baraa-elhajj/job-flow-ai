import express from "express";
import { fetchHNHiringJobs } from "../controllers/jobsController.js";

const router = express.Router();

router.get("/hnhiring", fetchHNHiringJobs);

export default router;
