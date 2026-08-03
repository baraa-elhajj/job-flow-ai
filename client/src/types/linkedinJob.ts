/**
 * LinkedIn job document as returned by GET /api/jobs/linkedin.
 */
export interface LinkedInJobApiResponse {
  _id: string;
  title: string;
  companyName?: string;
  companyLinkedInUrl?: string;
  location?: string;
  text?: string;
  url: string;
  datePosted?: number | Date | null;
  applicantCount?: string;
  benefits?: string;
  source?: "linkedin";
}
