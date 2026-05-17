import type { Request, Response } from "express";
import { User } from "../models/User.js";
import { verifyGoogleIdToken } from "../services/googleAuth.js";
import { signAuthToken } from "../utils/jwt.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: Response, token: string): void {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

function publicUser(user: {
  _id: unknown;
  email: string;
  name: string;
  picture?: string;
}) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    picture: user.picture,
  };
}

async function findOrCreateUser(googleUser: {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}) {
  const existing = await User.findOne({ googleId: googleUser.googleId });
  if (existing) {
    existing.email = googleUser.email;
    existing.name = googleUser.name;
    if (googleUser.picture !== undefined) {
      existing.picture = googleUser.picture;
    }
    await existing.save();
    return { user: existing, created: false };
  }

  const user = await User.create({
    googleId: googleUser.googleId,
    email: googleUser.email,
    name: googleUser.name,
    ...(googleUser.picture !== undefined ? { picture: googleUser.picture } : {}),
  });

  return { user, created: true };
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { credential } = req.body as { credential?: string };

  if (!credential) {
    res.status(400).json({ success: false, error: "Missing Google credential" });
    return;
  }

  try {
    const googleUser = await verifyGoogleIdToken(credential);
    const { user } = await findOrCreateUser(googleUser);

    const token = signAuthToken({
      userId: String(user._id),
      email: user.email,
    });

    setAuthCookie(res, token);
    res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error("Google login failed:", error);
    res.status(401).json({ success: false, error: "Google sign-in failed" });
  }
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.json({ success: true, user: null });
    return;
  }
  res.json({ success: true, user: publicUser(req.user) });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie("token");
  res.json({ success: true });
}
