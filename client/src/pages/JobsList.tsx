import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, Briefcase, Loader2 } from "lucide-react";

interface ParsedJob {
  _id: string;
  by: string;
  datePosted: string;
  title: string;
  text: string;
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

export default function JobsList() {
  const [jobs, setJobs] = useState<ParsedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/jobs/parsed?page=${page}&limit=20`);
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
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-red-400 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-4xl font-bold text-white mb-12">Available Jobs</h2>

        <div className="space-y-6">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {job.jobTitle?.join(", ") || job.title}
                  </h3>
                  <p className="text-blue-400 text-lg">
                    {job.companyName || job.by}
                  </p>
                </div>
                {job.salary && job.salary.length > 0 && (
                  <p className="text-lg font-semibold text-cyan-400">
                    {job.salary.join(", ")}
                  </p>
                )}
              </div>

              <p className="text-slate-300 mb-4 line-clamp-2">{job.text}</p>

              <div className="flex flex-wrap gap-4 text-slate-400 mb-4">
                {job.location && job.location.length > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    {job.location.join(", ")}
                  </div>
                )}
                {job.employmentType && job.employmentType.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    {job.employmentType.join(", ")}
                  </div>
                )}
                {job.jobType && job.jobType.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-500" />
                    {job.jobType.join(", ")}
                  </div>
                )}
              </div>

              {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.slice(0, 8).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 8 && (
                    <span className="px-3 py-1 text-sm bg-slate-700 text-slate-400 rounded-full">
                      +{job.skills.length - 8} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Posted: {job.datePosted}
                </span>
                <Link
                  to={`/jobs/${job._id}`}
                  className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-40 hover:bg-slate-600 transition"
            >
              Previous
            </button>
            <span className="flex items-center text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-40 hover:bg-slate-600 transition"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
