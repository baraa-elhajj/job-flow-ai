import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Clock, Briefcase, Loader2, ChevronDown } from "lucide-react";

interface LinkedInJob {
  _id: string;
  linkedin_url: string;
  job_title?: string;
  company?: string;
  company_linkedin_url?: string;
  location?: string;
  posted_date?: string;
  applicant_count?: string;
  job_description?: string;
  benefits?: string;
  createdAt: string;
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

function JobCard({ job }: { job: LinkedInJob }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg p-6 hover:border-gruvbox-orange transition shadow-sm hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className={`text-2xl font-bold text-gruvbox-fg0 ${showDetails ? "" : "line-clamp-2"}`}>{job.job_title}</h3>
          <p className="text-gruvbox-orange_light text-lg font-medium">{job.company}</p>
        </div>
        {job.applicant_count && (
          <span className="text-xs font-semibold bg-gruvbox-bg2 text-gruvbox-fg4 px-2 py-1 rounded border border-gruvbox-bg3">
            {job.applicant_count} applicants
          </span>
        )}
      </div>

      <div
        className={`text-gruvbox-fg2 mb-4 [&_a]:text-gruvbox-orange_light [&_a:hover]:text-gruvbox-orange_light [&_a]:underline [&_a]:font-medium whitespace-pre-wrap ${
          showDetails 
            ? "block [&_p]:mb-4 last:[&_p]:mb-0" 
            : "line-clamp-3 [&_p]:inline"
        }`}
        dangerouslySetInnerHTML={{ __html: job.job_description || "" }}
      />

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showDetails ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden mt-4">
          {job.location && (
            <CollapsibleSection title="Location" icon={<MapPin className="w-4 h-4 text-gruvbox-aqua" />}>
              <span className="px-3 py-1 text-sm bg-gruvbox-aqua/20 text-gruvbox-aqua_light rounded-full border border-gruvbox-aqua/30 flex items-center gap-1.5 w-fit">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </span>
            </CollapsibleSection>
          )}
          {job.benefits && (
            <CollapsibleSection title="Benefits" icon={<Briefcase className="w-4 h-4 text-gruvbox-yellow" />}>
              <p className="text-sm text-gruvbox-fg2 bg-gruvbox-bg2/50 p-3 rounded border border-gruvbox-bg3">
                {job.benefits}
              </p>
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
        <span className="text-sm text-gruvbox-gray">Posted on LinkedIn: {job.posted_date}</span>
        <div className="flex gap-3">
          {job.linkedin_url && (
            <a
              href={job.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-gruvbox-bg2 hover:bg-gruvbox-bg3 text-gruvbox-fg0 rounded-lg transition font-semibold"
            >
              Apply
            </a>
          )}
          <Link
            to={`/jobs/linkedin/${job._id}`}
            className="inline-block px-6 py-2 bg-gruvbox-orange hover:bg-gruvbox-orange_light text-gruvbox-fg0 rounded-lg transition font-semibold"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LinkedInJobsList({ hideHeader = false }: { hideHeader?: boolean }) {
  const [jobs, setJobs] = useState<LinkedInJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/jobs/linkedin?page=${page}&limit=20`);
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
        {!hideHeader && (
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
            <div>
              <h2 className="text-4xl font-bold text-gruvbox-fg0 mb-3">LinkedIn Jobs</h2>
              <p className="text-gruvbox-fg4 text-base max-w-2xl leading-relaxed">
                JobFlow AI aggregates premium job postings directly from LinkedIn, providing a clean and efficient way to browse the latest tech opportunities.
              </p>
            </div>
            
            <div className="flex bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg p-1">
              <button 
                onClick={() => navigate("/jobs")}
                className="px-6 py-2 text-gruvbox-fg4 hover:text-gruvbox-fg2 rounded-md font-semibold transition"
              >
                HN Hiring
              </button>
              <button 
                className="px-6 py-2 bg-gruvbox-orange text-gruvbox-fg0 rounded-md font-semibold transition shadow-sm"
              >
                LinkedIn
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))
          ) : (
            <div className="bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg p-12 text-center">
              <p className="text-gruvbox-fg4 text-lg">No LinkedIn jobs found.</p>
            </div>
          )}
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
