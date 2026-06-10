import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { JobsListItem } from "../types/job";
import JobsListItemRow from "../components/jobs/JobsListItemRow";
import SearchJobs from "../components/SearchJobs";

export default function JobsList({
  source,
  showSearch,
}: {
  source: string;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
}) {
  const [jobs, setJobs] = useState<JobsListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const query = searchParams.get("q") || "";
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      setError(null);
      try {
        const endpoint = `/api/jobs?src=${source}`;
        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", "20");

        if (query) params.set("q", query);

        const res = await fetch(`${endpoint}&${params.toString()}`);
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
  }, [page, source, query]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", String(newPage));
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-gruvbox-bg">
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${showSearch ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <SearchJobs showSearch={showSearch} />
        </div>

        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-gruvbox-orange_light animate-spin" />
          </div>
        ) : error ? (
          <div className="py-24 flex items-center justify-center">
            <p className="text-gruvbox-red_light text-lg">{error}</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {jobs.length > 0 ? (
                jobs.map((job) => <JobsListItemRow key={job._id} job={job} />)
              ) : (
                <div className="job-card p-12 text-center">
                  <p className="text-gruvbox-fg4 text-lg">No jobs found.</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-4 mt-12">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
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
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, page + 1))
                  }
                  disabled={page === totalPages}
                  className="px-6 py-2 bg-gruvbox-bg2 text-gruvbox-fg0 rounded-lg disabled:opacity-40 hover:bg-gruvbox-bg3 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
