import { useEffect, useState } from "react";
import { EyeOff, Loader2 } from "lucide-react";
import JobsListItemRow from "../components/jobs/JobsListItemRow";
import type { JobsListItem } from "../types/job";

function getHiddenJobIds(): string[] {
  try {
    const value = localStorage.getItem("hiddenJobIds");
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((id): id is string => typeof id === "string"))]
      : [];
  } catch {
    return [];
  }
}

export default function HiddenJobs() {
  const [jobs, setJobs] = useState<JobsListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHiddenJobs() {
      const ids = getHiddenJobIds();
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const response = await fetch(`/api/jobs/${encodeURIComponent(id)}`);
            if (response.status === 404) return null;
            if (!response.ok) {
              throw new Error("Could not load hidden jobs");
            }
            const data = (await response.json()) as {
              success: boolean;
              job?: JobsListItem;
            };
            return data.success && data.job ? data.job : null;
          }),
        );
        setJobs(results.filter((job): job is JobsListItem => job !== null));
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Could not load hidden jobs",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadHiddenJobs();
  }, []);

  const handleHiddenChange = (jobId: string, hidden: boolean) => {
    if (!hidden) {
      setJobs((current) => current.filter((job) => job._id !== jobId));
    }
  };

  return (
    <div className="min-h-screen bg-gruvbox-bg">
      <section className="max-w-6xl mx-auto px-6 py-10 pb-16">
        <div className="mb-8 border-b border-gruvbox-bg3 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <EyeOff className="w-7 h-7 text-gruvbox-orange" />
            <h1 className="text-3xl font-bold text-gruvbox-fg0">Hidden Jobs</h1>
          </div>
          <p className="text-gruvbox-fg4">
            Review jobs you hid and restore them to the main feed.
          </p>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-9 h-9 text-gruvbox-orange animate-spin" />
          </div>
        ) : error ? (
          <div className="job-card text-center text-gruvbox-red_light">
            {error}
          </div>
        ) : jobs.length === 0 ? (
          <div className="job-card p-12 text-center">
            <EyeOff className="w-10 h-10 mx-auto mb-3 text-gruvbox-fg4" />
            <p className="text-lg text-gruvbox-fg2">No hidden jobs.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <JobsListItemRow
                key={job._id}
                job={job}
                showHidden
                onHiddenChange={handleHiddenChange}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
