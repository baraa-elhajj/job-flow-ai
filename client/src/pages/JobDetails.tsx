import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface ParsedJob {
  _id: string;
  by: string;
  datePosted: string;
  title: string;
  text: string;
  links: string[];
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

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<ParsedJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/jobs/parsed/${id}`);
        const data = await res.json();
        if (data.success) {
          setJob(data.job);
        } else {
          setError(data.error || "Job not found");
        }
      } catch {
        setError("Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Job Not Found
        </h1>

        <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
          {error ||
            "The job you're looking for does not exist. It might have been removed or the ID is incorrect."}
        </p>

        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-white/80 transition-colors duration-300"
        >
          <ArrowLeft size={18} />
          Back to Jobs List
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="max-w-4xl mx-auto px-6 py-12">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-white hover:text-white/90 mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Jobs List
        </Link>

        {/* Job Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {job.jobTitle?.join(", ") || job.title}
          </h1>
          <p className="text-2xl text-blue-400 mb-6">
            {job.companyName || job.by}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 pb-8 border-b border-slate-700">
            {job.salary && job.salary.length > 0 && (
              <div>
                <p className="text-slate-400 text-sm uppercase mb-1">Salary</p>
                <p className="text-xl font-semibold text-cyan-400 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {job.salary.join(", ")}
                </p>
              </div>
            )}
            {job.location && job.location.length > 0 && (
              <div>
                <p className="text-slate-400 text-sm uppercase mb-1">
                  Location
                </p>
                <p className="text-lg text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  {job.location.join(", ")}
                </p>
              </div>
            )}
            {job.employmentType && job.employmentType.length > 0 && (
              <div>
                <p className="text-slate-400 text-sm uppercase mb-1">
                  Employment
                </p>
                <p className="text-lg text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  {job.employmentType.join(", ")}
                </p>
              </div>
            )}
            {job.jobType && job.jobType.length > 0 && (
              <div>
                <p className="text-slate-400 text-sm uppercase mb-1">
                  Work Type
                </p>
                <p className="text-lg text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  {job.jobType.join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* Seniority */}
          {job.seniority && job.seniority.length > 0 && (
            <div className="mb-6">
              <p className="text-slate-400 text-sm uppercase mb-2">Seniority</p>
              <div className="flex flex-wrap gap-2">
                {job.seniority.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-900/40 text-blue-300 rounded-full text-sm font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Visa Sponsorship */}
          {job.visaSponsorship && job.visaSponsorship.length > 0 && (
            <div className="mb-6">
              <p className="text-slate-400 text-sm uppercase mb-2">
                Visa Sponsorship
              </p>
              <div className="flex flex-wrap gap-2">
                {job.visaSponsorship.map((v, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-900/40 text-green-300 rounded-full text-sm font-medium"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply links */}
          {job.url && job.url.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {job.url.map((link, idx) => (
                <a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
                >
                  Apply <ExternalLink className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Job Description
          </h2>
          <p className="text-slate-300 whitespace-pre-line leading-relaxed">
            {job.text}
          </p>
        </div>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Required Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {job.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="text-center text-slate-500 text-sm mt-8">
          Posted by <span className="text-slate-400">{job.by}</span> on{" "}
          <span className="text-slate-400">{job.datePosted}</span>
        </div>
      </section>
    </div>
  );
}
