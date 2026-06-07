import express from "express";
import { fetchJobs } from "../controllers/jobsController.js";

const router = express.Router();

router.get("/", fetchJobs);

export default router;
