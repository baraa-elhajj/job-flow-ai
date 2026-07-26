import type { BaytJobApiResponse } from "./baytJob";
import type { HnhiringJobApiResponse } from "./hnhiringJob";
import type { LinkedInJobApiResponse } from "./linkedinJob";

/**
 * Row shown in the jobs list: normalized HN hiring, LinkedIn, or Bayt API payload.
 */
export type JobsListItem =
  | HnhiringJobApiResponse
  | LinkedInJobApiResponse
  | BaytJobApiResponse;

export type JobListSource = "hnhiring" | "linkedin" | "bayt";

export function isHnhiringJobApiResponse(job: JobsListItem): job is HnhiringJobApiResponse {
  return "source" in job && job.source === "hnhiring";
}

export function isLinkedInJobApiResponse(
  job: JobsListItem,
): job is LinkedInJobApiResponse {
  return "source" in job && job.source === "linkedin";
}

export function isBaytJobApiResponse(
  job: JobsListItem,
): job is BaytJobApiResponse {
  return "source" in job && job.source === "bayt";
}
