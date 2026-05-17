import { Router } from "express";
import {
  googleLogin,
  getMe,
  logout,
} from "../controllers/authController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/google", googleLogin);
router.get("/me", optionalAuth, getMe);
router.post("/logout", logout);

export default router;
