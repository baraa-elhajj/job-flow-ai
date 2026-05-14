/**
 * Common job model used across the app
 * Maps from both ParsedJob (HN Hiring) and LinkedInJob sources
 */
export interface JobModel {
  _id: string;
  title: string;
  company: string;
  description: string;
  isHtml: boolean; // true for HN jobs (already HTML), false for LinkedIn (plain text)
  locations: string[];
  skills?: string[];
  datePosted: string;
  url?: string;
  source: "hn" | "linkedin";
}
