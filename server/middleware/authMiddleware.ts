import type { Request, Response, NextFunction } from "express";
import { User, type IUser } from "../models/User.js";
import { verifyAuthToken } from "../utils/jwt.js";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({ success: false, error: "User not found" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired session" });
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.token;
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.userId);
    if (user) req.user = user;
  } catch {
    res.clearCookie("token");
  }
  next();
}
