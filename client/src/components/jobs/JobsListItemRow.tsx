import { useEffect, useState } from "react";
import type { JobsListItem } from "../../types/job";
import {
  isHnhiringJobApiResponse,
  isLinkedInJobApiResponse,
} from "../../types/job";
import HnhiringJobListItem from "./HnhiringJobListItem";
import LinkedInJobListItem from "./LinkedInJobListItem";

export default function JobsListItemRow({ job }: { job: JobsListItem }) {
  const [isApplied, setIsApplied] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("appliedJobIds");
      const parsed: string[] = saved ? JSON.parse(saved) : [];
      return parsed.includes(job._id);
    } catch {
      return false;
    }
  });

  const [isHidden, setIsHidden] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("hiddenJobIds");
      const parsed: string[] = saved ? JSON.parse(saved) : [];
      return parsed.includes(job._id);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("appliedJobIds");
      let currentIds: string[] = saved ? JSON.parse(saved) : [];

      if (isApplied) {
        if (!currentIds.includes(job._id)) currentIds.push(job._id);
      } else {
        currentIds = currentIds.filter((id) => id !== job._id);
      }
      localStorage.setItem("appliedJobIds", JSON.stringify(currentIds));
    } catch (error) {
      console.error("Error updating localStorage for applied jobs:", error);
    }
  }, [isApplied, job._id]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hiddenJobIds");
      let currentIds: string[] = saved ? JSON.parse(saved) : [];

      if (isHidden) {
        if (!currentIds.includes(job._id)) currentIds.push(job._id);
      } else {
        currentIds = currentIds.filter((id) => id !== job._id);
      }
      localStorage.setItem("hiddenJobIds", JSON.stringify(currentIds));
    } catch (error) {
      console.error("Error updating localStorage for hidden jobs:", error);
    }
  }, [isHidden, job._id]);

  if (isHidden) {
    return null;
  }

  const clientActions = {
    isApplied,
    toggleApplied: () => setIsApplied((prev) => !prev),
    hideJob: () => setIsHidden(true),
  };

  if (isHnhiringJobApiResponse(job)) {
    return <HnhiringJobListItem job={job} actions={clientActions} />;
  }
  if (isLinkedInJobApiResponse(job)) {
    return <LinkedInJobListItem job={job} actions={clientActions} />;
  }
  return null;
}

export interface JobActions {
  isApplied: boolean;
  toggleApplied: () => void;
  hideJob: () => void;
}
