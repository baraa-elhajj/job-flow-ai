import type { HnhiringJobApiResponse } from "./hnhiringJob";
import type { LinkedInJobApiResponse } from "./linkedinJob";

/**
 * Row shown in the jobs list: normalized HN hiring, or LinkedIn API payload as-is.
 */
export type JobsListItem = HnhiringJobApiResponse | LinkedInJobApiResponse;

export type JobListSource = "hnhiring" | "linkedin";

export function isHnhiringJobApiResponse(job: JobsListItem): job is HnhiringJobApiResponse {
  return "source" in job && job.source === "hnhiring";
}

export function isLinkedInJobApiResponse(
  job: JobsListItem,
): job is LinkedInJobApiResponse {
  return "source" in job && job.source === "linkedin";
}
