import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { JobsListItem } from "../types/job";
import JobsListItemRow from "../components/jobs/JobsListItemRow";


export default function JobsList({ source }: { source: string }) {
  const [jobs, setJobs] = useState<JobsListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
    setError(null);
  }, [source]);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      setError(null);
      try {
        const endpoint = `/api/jobs?src=${source}`;
        const res = await fetch(`${endpoint}&page=${page}&limit=20`);
        const data = await res.json();
        if (data.success) {

          setJobs(data.jobs);
          setTotalPages(data.totalPages);
        } else {
          setError(data.error || "Failed to fetch jobs");
        }
      } catch (e) {
        setError("Could not connect to the server. " + e);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [page, source]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gruvbox-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gruvbox-orange_light animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gruvbox-bg flex items-center justify-center">
        <p className="text-gruvbox-red_light text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gruvbox-bg">
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-6">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <JobsListItemRow key={job._id} job={job} />
            ))
          ) : (
            <div className="bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg p-12 text-center">
              <p className="text-gruvbox-fg4 text-lg">No jobs found.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-12">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-2 bg-gruvbox-bg2 text-gruvbox-fg0 rounded-lg disabled:opacity-40 hover:bg-gruvbox-bg3 transition"
            >
              Previous
            </button>
            <span className="flex items-center text-gruvbox-fg4">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-6 py-2 bg-gruvbox-bg2 text-gruvbox-fg0 rounded-lg disabled:opacity-40 hover:bg-gruvbox-bg3 transition"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
