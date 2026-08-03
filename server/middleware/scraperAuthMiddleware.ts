import type { Request, Response, NextFunction } from "express";

export interface ScraperRequest extends Request {
  scraperAuthorized?: boolean;
}

function readApiKey(req: Request): string | undefined {
  const headerKey = req.header("x-scraper-api-key")?.trim();
  if (headerKey) {
    return headerKey;
  }

  const authHeader = req.header("authorization")?.trim();
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return undefined;
}

export function requireScraperApiKey(
  req: ScraperRequest,
  res: Response,
  next: NextFunction,
): void {
  const configuredKey = process.env.SCRAPER_API_KEY?.trim();
  if (!configuredKey) {
    res.status(503).json({
      success: false,
      error: "SCRAPER_API_KEY is not configured on the server",
    });
    return;
  }

  const providedKey = readApiKey(req);
  if (!providedKey || providedKey !== configuredKey) {
    res.status(401).json({
      success: false,
      error: "Invalid or missing scraper API key",
    });
    return;
  }

  req.scraperAuthorized = true;
  next();
}
