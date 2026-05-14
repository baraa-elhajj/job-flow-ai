import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Loader2, ChevronDown } from "lucide-react";
import type { JobModel } from "../types/job";

interface HNHiringJobResponse {
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

interface LinkedInJobResponse {
  _id: string;
  title: string;
  company?: string;
  location?: string;
  jobDescription?: string;
  url: string;
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
          className={`w-3.5 h-3.5 text-gruvbox-gray transition-transform duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open
            ? "grid-rows-[1fr] opacity-100 mt-3"
            : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function JobCard({ job }: { job: JobModel }) {
  const [showDetails, setShowDetails] = useState(false);

  // For LinkedIn jobs (plain text), we need to add proper formatting
  const displayDescription = job.isHtml
    ? job.description
    : `<p>${(job.description || "").replace(/\n/g, "</p><p>")}</p>`;

  return (
    <div className="bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg p-6 hover:border-gruvbox-orange transition shadow-sm hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3
            className={`text-2xl font-bold text-gruvbox-fg0 ${showDetails ? "" : "line-clamp-2"}`}
          >
            {job.title}
          </h3>
          <p className="text-gruvbox-orange_light text-lg font-medium">
            {job.company}
          </p>
        </div>
      </div>

      <div
        className={`text-gruvbox-fg2 mb-4 [&_a]:text-gruvbox-orange_light [&_a:hover]:text-gruvbox-orange_light [&_a]:underline [&_a]:font-medium whitespace-pre-wrap ${
          showDetails
            ? "block [&_p]:mb-4 last:[&_p]:mb-0"
            : "line-clamp-3 [&_p]:inline"
        }`}
        dangerouslySetInnerHTML={{ __html: displayDescription }}
      />

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showDetails
            ? "grid-rows-[1fr] opacity-100 mb-4"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden mt-4">
          {job.locations && job.locations.length > 0 && (
            <CollapsibleSection
              title="Location"
              icon={<MapPin className="w-4 h-4 text-gruvbox-aqua" />}
            >
              <div className="flex flex-wrap gap-2">
                {job.locations.slice(0, 3).map((loc, idx) => (
                  <span
                    key={`loc-${idx}`}
                    className="px-3 py-1 text-sm bg-gruvbox-aqua/20 text-gruvbox-aqua_light rounded-full border border-gruvbox-aqua/30 flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {loc}
                  </span>
                ))}
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
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-gruvbox-fg4 text-sm flex items-center justify-center w-full gap-1.5 mt-4 mb-2 hover:text-gruvbox-fg0 transition font-medium bg-gruvbox-bg1/80 hover:bg-gruvbox-bg2/50 py-2 rounded-lg border border-transparent hover:border-gruvbox-bg4/50"
      >
        {showDetails ? "Hide Less" : "Show More"}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${
            showDetails ? "rotate-180" : ""
          }`}
        />
      </button>

      <div className="flex items-center justify-between mt-2 pt-4 border-t border-gruvbox-bg3/50">
        <span className="text-sm text-gruvbox-gray">
          Posted: {job.datePosted}
        </span>
        <div className="flex gap-2">
          {job.source === "linkedin" && job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-gruvbox-aqua hover:bg-gruvbox-aqua_light text-gruvbox-bg1 rounded-lg transition font-semibold"
            >
              Apply Now
            </a>
          )}
          {job.source === "hn" && (
            <Link
              to={`/jobs/${job._id}`}
              className="inline-block px-6 py-2 bg-gruvbox-orange hover:bg-gruvbox-orange_light text-gruvbox-fg0 rounded-lg transition font-semibold"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobsList({
  hideHeader = false,
  source = "hn",
}: {
  hideHeader?: boolean;
  source?: "hn" | "linkedin";
}) {
  const [jobs, setJobs] = useState<JobModel[]>([]);
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
        const endpoint =
          source === "linkedin" ? "/api/jobs/linkedin" : "/api/jobs/parsed";
        const res = await fetch(`${endpoint}?page=${page}&limit=20`);
        const data = await res.json();
        if (data.success) {
          // Map the response to JobModel
          const mappedJobs = data.jobs.map(
            (job: HNHiringJobResponse | LinkedInJobResponse) => {
              if (source === "linkedin") {
                const linkedinJob = job as LinkedInJobResponse;
                return {
                  _id: linkedinJob._id,
                  title: linkedinJob.title,
                  company: linkedinJob.company || "Unknown Company",
                  description:
                    linkedinJob.jobDescription || "No description provided",
                  isHtml: false,
                  locations: linkedinJob.location ? [linkedinJob.location] : [],
                  skills: undefined,
                  datePosted: new Date(
                    linkedinJob.createdAt,
                  ).toLocaleDateString(),
                  url: linkedinJob.url,
                  source: "linkedin" as const,
                };
              } else {
                const hnHiringJob = job as HNHiringJobResponse;
                return {
                  _id: hnHiringJob._id,
                  title: hnHiringJob.title,
                  company: hnHiringJob.companyName || hnHiringJob.by,
                  description: hnHiringJob.text,
                  isHtml: true,
                  locations: hnHiringJob.location || [],
                  skills: hnHiringJob.skills,
                  datePosted: hnHiringJob.datePosted,
                  source: "hn" as const,
                };
              }
            },
          );
          setJobs(mappedJobs);
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
        {!hideHeader && (
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
            <div>
              <h2 className="text-4xl font-bold text-gruvbox-fg0 mb-3">
                {source === "linkedin" ? "LinkedIn Jobs" : "HN Hiring Jobs"}
              </h2>
              <p className="text-gruvbox-fg4 text-base max-w-2xl leading-relaxed">
                {source === "linkedin"
                  ? "LinkedIn job listings aggregated and indexed for easy browsing."
                  : "JobFlow AI automatically aggregates and parses unstructured job postings from Hacker News. We use advanced extraction to turn noisy comment threads into clean, scannable job cards."}
              </p>
            </div>

            <div className="flex bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg p-1">
              <button
                onClick={() => navigate("/jobs")}
                className={`px-6 py-2 rounded-md font-semibold transition shadow-sm ${
                  source === "hn"
                    ? "bg-gruvbox-orange text-gruvbox-fg0"
                    : "text-gruvbox-fg4 hover:text-gruvbox-fg2"
                }`}
              >
                HN Hiring
              </button>
              <button
                onClick={() => navigate("/jobs/linkedin")}
                className={`px-6 py-2 rounded-md font-semibold transition ${
                  source === "linkedin"
                    ? "bg-gruvbox-orange text-gruvbox-fg0 shadow-sm"
                    : "text-gruvbox-fg4 hover:text-gruvbox-fg2"
                }`}
              >
                LinkedIn
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {jobs.length > 0 ? (
            jobs.map((job) => <JobCard key={job._id} job={job} />)
          ) : (
            <div className="bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg p-12 text-center">
              <p className="text-gruvbox-fg4 text-lg">No jobs found.</p>
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
