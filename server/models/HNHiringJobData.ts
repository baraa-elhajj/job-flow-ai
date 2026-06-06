// Base interface for plain job data (used in scraping logic)
export interface HNHiringJobData {
  by: string;
  datePosted: string;
  title: string;
  text: string;
  links: string[];
  monthYear: string;
  source: "hnhiring";
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
