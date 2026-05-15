/**
 * LinkedIn job document as returned by GET /api/jobs/linkedin.
 */
export interface LinkedInJobApiResponse {
  _id: string;
  job_title: string;
  company?: string;
  location?: string;
  job_description?: string;
  linkedin_url: string;
  posted_date: string;
  source?: "linkedin";
}
