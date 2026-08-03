/**
 * Bayt.com job document as returned by GET /api/jobs?src=bayt.
 */
export interface BaytJobApiResponse {
  _id: string;
  title: string;
  companyName?: string;
  location?: string;
  text?: string;
  url: string;
  datePosted?: number | Date | null;
  source?: "bayt";
}
