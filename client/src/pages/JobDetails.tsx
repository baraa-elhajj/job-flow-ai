import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Briefcase,
  Loader2,
  ChevronDown,
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

/**
 * A collapsible section with a header, chevron icon, and smooth expand/collapse animation.
 */
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left group"
      >
        {icon}
        <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold group-hover:text-slate-300 transition-colors">
          {title}
        </p>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"
            }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
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
      <section className="max-w-7xl mx-auto px-6 py-12">
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
            {job.title}
          </h1>
          <p className="text-2xl text-blue-400 mb-6">
            {job.companyName || job.by}
          </p>



          {/* Location */}
          {job.location && job.location.length > 0 && (
            <CollapsibleSection title="Location" icon={<MapPin className="w-4 h-4 text-cyan-500" />}>
              <div className="flex flex-wrap gap-2">
                {job.location.map((loc, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-cyan-900/40 text-cyan-300 rounded-full text-sm font-medium border border-cyan-700/30"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Employment Type */}
          {job.employmentType && job.employmentType.length > 0 && (
            <CollapsibleSection title="Employment Type" icon={<Clock className="w-4 h-4 text-emerald-500" />}>
              <div className="flex flex-wrap gap-2">
                {job.employmentType.map((emp, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-emerald-900/40 text-emerald-300 rounded-full text-sm font-medium border border-emerald-700/30"
                  >
                    {emp}
                  </span>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Work Type */}
          {job.jobType && job.jobType.length > 0 && (
            <CollapsibleSection title="Work Type" icon={<Briefcase className="w-4 h-4 text-amber-500" />}>
              <div className="flex flex-wrap gap-2">
                {job.jobType.map((wt, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-amber-900/40 text-amber-300 rounded-full text-sm font-medium border border-amber-700/30"
                  >
                    {wt}
                  </span>
                ))}
              </div>
            </CollapsibleSection>
          )}
          {job.jobTitle && job.jobTitle.length > 0 && (
            <CollapsibleSection title="Roles">
              <div className="flex flex-wrap gap-2">
                {job.jobTitle.map((role, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-900/40 text-purple-300 rounded-full text-sm font-medium border border-purple-700/30"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Seniority */}
          {job.seniority && job.seniority.length > 0 && (
            <CollapsibleSection title="Seniority">
              <div className="flex flex-wrap gap-2">
                {job.seniority.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-900/40 text-blue-300 rounded-full text-sm font-medium border border-blue-700/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Visa Sponsorship */}
          {job.visaSponsorship && job.visaSponsorship.length > 0 && (
            <CollapsibleSection title="Visa Sponsorship">
              <div className="flex flex-wrap gap-2">
                {job.visaSponsorship.map((v, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-900/40 text-green-300 rounded-full text-sm font-medium border border-green-700/30"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </CollapsibleSection>
          )}

        </div>

        {/* Job Description */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Job Description
          </h2>
          <div
            className="text-slate-300 leading-relaxed [&_p]:mb-4 last:[&_p]:mb-0 [&_a]:text-blue-400 [&_a:hover]:text-blue-300 [&_a]:underline [&_a]:font-medium"
            dangerouslySetInnerHTML={{ __html: job.text }}
          />
        </div>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
            <CollapsibleSection title="Required Skills">
              <div className="flex flex-wrap gap-3">
                {job.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-600/50"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </CollapsibleSection>
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
