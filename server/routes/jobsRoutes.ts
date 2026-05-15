import express from "express";
import {
    fetchJobs,
    fetchParsedJobById,
} from "../controllers/jobsController.js";

const router = express.Router();

router.get("/", fetchJobs);
router.get("/parsed/:id", fetchParsedJobById);

export default router;
