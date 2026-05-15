/**
 * Raw HN Hiring job shape from the API (parsed / Jobs collection).
 */
export interface HnhiringJobApiResponse {
  _id: string;
  by: string;
  datePosted: string;
  title: string;
  text: string;
  source?: "hnhiring";
  companyName?: string;
  jobTitle?: string[];
  jobType?: string[];
  employmentType?: string[];
  location?: string[];
  skills?: string[];
  seniority?: string[];
  salary?: string[];
  visaSponsorship?: string[];
  url?: string[];
}