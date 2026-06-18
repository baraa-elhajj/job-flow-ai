import type { JobsListItem } from "../../types/job";
import {
  isHnhiringJobApiResponse,
  isLinkedInJobApiResponse,
} from "../../types/job";
import HnhiringJobListItem from "./HnhiringJobListItem";
import LinkedInJobListItem from "./LinkedInJobListItem";

export default function JobsListItemRow({ job }: { job: JobsListItem }) {
  if (isHnhiringJobApiResponse(job)) {
    return <HnhiringJobListItem job={job} />;
  }
  if (isLinkedInJobApiResponse(job)) {
    return <LinkedInJobListItem job={job} />;
  }
  return null;
}
