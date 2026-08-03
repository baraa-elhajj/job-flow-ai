import express from "express";
import {
  checkExistingUrls,
  ingestJobs,
} from "../controllers/scraperController.js";
import { requireScraperApiKey } from "../middleware/scraperAuthMiddleware.js";

const router = express.Router();

router.use(requireScraperApiKey);

router.post("/existing-urls", checkExistingUrls);
router.post("/jobs", ingestJobs);

export default router;
