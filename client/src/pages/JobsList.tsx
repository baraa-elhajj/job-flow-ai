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
    <div className="mb-4 bg-gruvbox-bg1/50 p-3 rounded-lg border border-gruvbox-bg3/50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left group"
      >
        {icon}
        <p className="text-gruvbox-fg4 text-xs uppercase tracking-wider font-semibold group-hover:text-gruvbox-fg2 transition-colors">
          {title}
        </p>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gruvbox-gray transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"
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


function JobCard({ job }: { job: ParsedJob }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg p-6 hover:border-gruvbox-orange transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-2xl font-bold text-gruvbox-fg0 ${showDetails ? "" : "line-clamp-2"}`}>{job.title}</h3>
          <p className="text-gruvbox-orange_light text-lg">{job.companyName || job.by}</p>
        </div>
      </div>

      <div
        className={`text-gruvbox-fg2 mb-4 [&_a]:text-gruvbox-orange_light [&_a:hover]:text-gruvbox-orange_light [&_a]:underline [&_a]:font-medium ${
          showDetails 
            ? "block [&_p]:mb-4 last:[&_p]:mb-0" 
            : "line-clamp-2 [&_p]:inline"
        }`}
        dangerouslySetInnerHTML={{ __html: job.text }}
      />

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showDetails ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden mt-4">
          {job.location && job.location.length > 0 && (
            <CollapsibleSection title="Location" icon={<MapPin className="w-4 h-4 text-gruvbox-aqua" />}>
              <div className="flex flex-wrap gap-2">
                {job.location.slice(0, 3).map((loc, idx) => (
                  <span
                    key={`loc-${idx}`}
                    className="px-3 py-1 text-sm bg-gruvbox-aqua/20 text-gruvbox-aqua_light rounded-full border border-gruvbox-aqua/30 flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {loc}
                  </span>
                ))}
                {job.location.length > 3 && (
                  <span className="px-3 py-1 text-sm bg-gruvbox-aqua/10 text-gruvbox-aqua_light rounded-full border border-gruvbox-aqua/20">
                    +{job.location.length - 3} more
                  </span>
                )}
              </div>
            </CollapsibleSection>
          )}

          {job.employmentType && job.employmentType.length > 0 && (
            <CollapsibleSection title="Employment Type" icon={<Clock className="w-4 h-4 text-gruvbox-green" />}>
              <div className="flex flex-wrap gap-2">
                {job.employmentType.slice(0, 2).map((emp, idx) => (
                  <span
                    key={`emp-${idx}`}
                    className="px-3 py-1 text-sm bg-gruvbox-green/20 text-gruvbox-green_light rounded-full border border-gruvbox-green/30 flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {emp}
                  </span>
                ))}
                {job.employmentType.length > 2 && (
                  <span className="px-3 py-1 text-sm bg-gruvbox-green/10 text-gruvbox-green_light rounded-full border border-gruvbox-green/20">
                    +{job.employmentType.length - 2} more
                  </span>
                )}
              </div>
            </CollapsibleSection>
          )}

          {job.jobType && job.jobType.length > 0 && (
            <CollapsibleSection title="Work Type" icon={<Briefcase className="w-4 h-4 text-gruvbox-yellow" />}>
              <div className="flex flex-wrap gap-2">
                {job.jobType.slice(0, 2).map((wt, idx) => (
                  <span
                    key={`wt-${idx}`}
                    className="px-3 py-1 text-sm bg-gruvbox-yellow/20 text-gruvbox-yellow_light rounded-full border border-gruvbox-yellow/30 flex items-center gap-1.5"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    {wt}
                  </span>
                ))}
                {job.jobType.length > 2 && (
                  <span className="px-3 py-1 text-sm bg-gruvbox-yellow/10 text-gruvbox-yellow_light rounded-full border border-gruvbox-yellow/20">
                    +{job.jobType.length - 2} more
                  </span>
                )}
              </div>
            </CollapsibleSection>
          )}

          {job.jobTitle && job.jobTitle.length > 0 && (
            <CollapsibleSection title="Roles">
              <div className="flex flex-wrap gap-2">
                {job.jobTitle.slice(0, 4).map((role, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm bg-gruvbox-purple/20 text-gruvbox-purple_light rounded-full border border-gruvbox-purple/30"
                  >
                    {role}
                  </span>
                ))}
                {job.jobTitle.length > 4 && (
                  <span className="px-3 py-1 text-sm bg-gruvbox-purple/10 text-gruvbox-purple_light rounded-full border border-gruvbox-purple/20">
                    +{job.jobTitle.length - 4} more
                  </span>
                )}
              </div>
            </CollapsibleSection>
          )}

          {job.skills && job.skills.length > 0 && (
            <CollapsibleSection title="Required Skills">
              <div className="flex flex-wrap gap-2">
                {job.skills.slice(0, 8).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm bg-gruvbox-bg2 text-gruvbox-fg2 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {job.skills.length > 8 && (
                  <span className="px-3 py-1 text-sm bg-gruvbox-bg2 text-gruvbox-fg4 rounded-full">
                    +{job.skills.length - 8} more
                  </span>
                )}
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-gruvbox-fg4 text-sm flex items-center justify-center w-full gap-1.5 mt-4 mb-2 hover:text-gruvbox-fg0 transition font-medium bg-gruvbox-bg1/80 hover:bg-gruvbox-bg2/50 py-2 rounded-lg border border-transparent hover:border-gruvbox-bg4/50"
      >
        {showDetails ? "Hide Details" : "Show Details"}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${
            showDetails ? "rotate-180" : ""
          }`}
        />
      </button>

      <div className="flex items-center justify-between mt-2 pt-4 border-t border-gruvbox-bg3/50">
        <span className="text-sm text-gruvbox-gray">Posted: {job.datePosted}</span>
        <Link
          to={`/jobs/${job._id}`}
          className="inline-block px-6 py-2 bg-gruvbox-orange hover:bg-gruvbox-orange_light text-gruvbox-fg0 rounded-lg transition font-semibold"
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
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gruvbox-fg0 mb-3">Available Jobs</h2>
            <p className="text-gruvbox-fg4 text-base max-w-2xl leading-relaxed">
              JobFlow AI automatically aggregates and parses unstructured job postings from top developer forums. We use advanced extraction to turn noisy comment threads into clean, scannable job cards.
            </p>
          </div>
          
          <div className="flex bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg p-1">
            <button className="px-6 py-2 bg-gruvbox-orange text-gruvbox-fg0 rounded-md font-semibold transition shadow-sm">
              HN Hiring
            </button>
            <button 
              className="px-6 py-2 text-gruvbox-fg4 hover:text-gruvbox-fg2 rounded-md font-semibold transition cursor-not-allowed opacity-60" 
              title="Coming Soon"
              disabled
            >
              LinkedIn
            </button>
          </div>
        </div>

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
              className="px-6 py-2 bg-gruvbox-bg2 text-gruvbox-fg0 rounded-lg disabled:opacity-40 hover:bg-gruvbox-bg3 transition"
            >
              Previous
            </button>
            <span className="flex items-center text-gruvbox-fg4">
              Page {page} of {totalPages}
            </span>
            <button
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
