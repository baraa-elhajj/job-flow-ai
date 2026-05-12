import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, Briefcase, Loader2, ChevronDown } from "lucide-react";

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

function JobCard({ job }: { job: ParsedJob }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">{job.title}</h3>
          <p className="text-blue-400 text-lg">{job.companyName || job.by}</p>
        </div>
      </div>

      <div
        className={`text-slate-300 mb-4 [&_a]:text-blue-400 [&_a:hover]:text-blue-300 [&_a]:underline [&_a]:font-medium ${
          showDetails 
            ? "block [&_p]:mb-4 last:[&_p]:mb-0" 
            : "line-clamp-2 [&_p]:inline"
        }`}
        dangerouslySetInnerHTML={{ __html: job.text }}
      />

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-slate-400 text-sm flex items-center gap-1.5 mb-2 hover:text-white transition font-medium"
      >
        {showDetails ? "Hide Details" : "Show Details"}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${
            showDetails ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showDetails ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-2 mb-3 pt-2">
            {job.location &&
              job.location.slice(0, 3).map((loc, idx) => (
                <span
                  key={`loc-${idx}`}
                  className="px-3 py-1 text-sm bg-cyan-900/40 text-cyan-300 rounded-full border border-cyan-700/30 flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {loc}
                </span>
              ))}
            {job.location && job.location.length > 3 && (
              <span className="px-3 py-1 text-sm bg-cyan-900/20 text-cyan-400 rounded-full border border-cyan-700/20">
                +{job.location.length - 3} more
              </span>
            )}

            {job.employmentType &&
              job.employmentType.slice(0, 2).map((emp, idx) => (
                <span
                  key={`emp-${idx}`}
                  className="px-3 py-1 text-sm bg-emerald-900/40 text-emerald-300 rounded-full border border-emerald-700/30 flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {emp}
                </span>
              ))}
            {job.employmentType && job.employmentType.length > 2 && (
              <span className="px-3 py-1 text-sm bg-emerald-900/20 text-emerald-400 rounded-full border border-emerald-700/20">
                +{job.employmentType.length - 2} more
              </span>
            )}

            {job.jobType &&
              job.jobType.slice(0, 2).map((wt, idx) => (
                <span
                  key={`wt-${idx}`}
                  className="px-3 py-1 text-sm bg-amber-900/40 text-amber-300 rounded-full border border-amber-700/30 flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  {wt}
                </span>
              ))}
            {job.jobType && job.jobType.length > 2 && (
              <span className="px-3 py-1 text-sm bg-amber-900/20 text-amber-400 rounded-full border border-amber-700/20">
                +{job.jobType.length - 2} more
              </span>
            )}
          </div>

          {job.jobTitle && job.jobTitle.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {job.jobTitle.slice(0, 4).map((role, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm bg-purple-900/40 text-purple-300 rounded-full border border-purple-700/30"
                >
                  {role}
                </span>
              ))}
              {job.jobTitle.length > 4 && (
                <span className="px-3 py-1 text-sm bg-purple-900/20 text-purple-400 rounded-full border border-purple-700/20">
                  +{job.jobTitle.length - 4} more
                </span>
              )}
            </div>
          )}

          {job.skills && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
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
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-700/50">
        <span className="text-sm text-slate-500">Posted: {job.datePosted}</span>
        <Link
          to={`/jobs/${job._id}`}
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
        >
          View Details
        </Link>
      </div>
    </div>
  );
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
            <JobCard key={job._id} job={job} />
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
