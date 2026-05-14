import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Loader2, ChevronDown } from "lucide-react";

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
          className={`w-4 h-4 text-gruvbox-gray transition-transform duration-300 ${
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
          {error || "The job you're looking for does not exist."}
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
          <h1 className="text-4xl font-bold text-gruvbox-fg0 mb-2">
            {job.title}
          </h1>
          <p className="text-2xl text-gruvbox-orange_light mb-6">
            {job.companyName || job.by}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {job.location && job.location.length > 0 && (
                <CollapsibleSection
                  title="Location"
                  icon={<MapPin className="w-4 h-4 text-gruvbox-aqua" />}
                >
                  <div className="flex flex-wrap gap-2">
                    {job.location.map((loc, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gruvbox-aqua/20 text-gruvbox-aqua_light rounded-full text-sm font-medium border border-gruvbox-aqua/30"
                      >
                        {loc}
                      </span>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
              {job.employmentType && job.employmentType.length > 0 && (
                <CollapsibleSection
                  title="Employment Type"
                  icon={<Clock className="w-4 h-4 text-gruvbox-green" />}
                >
                  <div className="flex flex-wrap gap-2">
                    {job.employmentType.map((emp, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gruvbox-green/20 text-gruvbox-green_light rounded-full text-sm font-medium border border-gruvbox-green/30"
                      >
                        {emp}
                      </span>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </div>
            <div className="space-y-4">
              {job.skills && job.skills.length > 0 && (
                <CollapsibleSection title="Required Skills">
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gruvbox-bg2 text-gruvbox-fg1 rounded-lg text-sm font-medium border border-gruvbox-bg4/50"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gruvbox-fg0 mb-4">
            Job Description
          </h2>
          <div
            className="text-gruvbox-fg2 leading-relaxed [&_p]:mb-4 last:[&_p]:mb-0 [&_a]:text-gruvbox-orange_light [&_a:hover]:text-gruvbox-orange_light [&_a]:underline [&_a]:font-medium"
            dangerouslySetInnerHTML={{ __html: job.text }}
          />
        </div>

        {/* Meta info */}
        <div className="text-center text-gruvbox-gray text-sm mt-8">
          Posted by <span className="text-gruvbox-fg4">{job.by}</span> on{" "}
          <span className="text-gruvbox-fg4">{job.datePosted}</span>
        </div>
      </section>
    </div>
  );
}
