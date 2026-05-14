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
    <div className="mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left group"
      >
        {icon}
        <p className="text-gruvbox-fg4 text-sm uppercase tracking-wider font-semibold group-hover:text-gruvbox-fg2 transition-colors">
          {title}
        </p>
        <ChevronDown
          className={`w-4 h-4 text-gruvbox-gray transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"
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

export default function LinkedInJobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState<LinkedInJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/jobs/linkedin/${id}`);
        const data = await res.json();
        if (data.success) {
          setJob(data.job);
        } else {
          setError(data.error || "LinkedIn job not found");
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
      <div className="min-h-screen bg-gruvbox-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gruvbox-orange_light animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gruvbox-bg flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gruvbox-fg0 mb-4">
          Job Not Found
        </h1>
        <p className="text-gruvbox-fg4 max-w-md mb-8 leading-relaxed">
          {error || "The LinkedIn job you're looking for does not exist."}
        </p>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 bg-gruvbox-fg0 text-gruvbox-bg0_h px-6 py-3 rounded-lg font-semibold hover:bg-gruvbox-fg0/80 transition-colors duration-300"
        >
          <ArrowLeft size={18} />
          Back to Jobs List
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gruvbox-bg">
      <section className="max-w-7xl mx-auto px-6 py-12">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-gruvbox-fg0 hover:text-gruvbox-fg0/90 mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Jobs List
        </Link>

        {/* Job Header */}
        <div className="bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg p-8 mb-8 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gruvbox-fg0 mb-2">{job.job_title}</h1>
              <p className="text-2xl text-gruvbox-orange_light font-medium">{job.company}</p>
            </div>
            {job.linkedin_url && (
              <a
                href={job.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gruvbox-orange hover:bg-gruvbox-orange_light text-gruvbox-bg0_h px-6 py-3 rounded-lg font-bold transition shadow-md"
              >
                Apply on LinkedIn
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-4">
              {job.location && (
                <CollapsibleSection title="Location" icon={<MapPin className="w-4 h-4 text-gruvbox-aqua" />}>
                  <span className="px-3 py-1 bg-gruvbox-aqua/20 text-gruvbox-aqua_light rounded-full text-sm font-medium border border-gruvbox-aqua/30">
                    {job.location}
                  </span>
                </CollapsibleSection>
              )}
              {job.applicant_count && (
                <CollapsibleSection title="Applicants" icon={<Clock className="w-4 h-4 text-gruvbox-green" />}>
                  <span className="text-gruvbox-fg2">{job.applicant_count}</span>
                </CollapsibleSection>
              )}
            </div>

            <div className="space-y-4">
              {job.benefits && (
                <CollapsibleSection title="Benefits" icon={<Briefcase className="w-4 h-4 text-gruvbox-yellow" />}>
                  <p className="text-sm text-gruvbox-fg2 leading-relaxed bg-gruvbox-bg2/30 p-4 rounded-lg border border-gruvbox-bg3">
                    {job.benefits}
                  </p>
                </CollapsibleSection>
              )}
              {job.posted_date && (
                <CollapsibleSection title="Posted Date" icon={<Clock className="w-4 h-4 text-gruvbox-orange" />}>
                   <span className="text-gruvbox-fg2">{job.posted_date}</span>
                </CollapsibleSection>
              )}
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gruvbox-fg0 mb-6 pb-2 border-b border-gruvbox-bg3">
            Job Description
          </h2>
          <div
            className="text-gruvbox-fg2 leading-relaxed whitespace-pre-wrap [&_p]:mb-4 last:[&_p]:mb-0 [&_a]:text-gruvbox-orange_light [&_a:hover]:text-gruvbox-orange_light [&_a]:underline [&_a]:font-medium"
            dangerouslySetInnerHTML={{ __html: job.job_description || "" }}
          />
        </div>

        {/* Meta info */}
        <div className="text-center text-gruvbox-gray text-sm mt-8 pb-12">
          Source: LinkedIn • {job.posted_date}
        </div>
      </section>
    </div>
  );
}
