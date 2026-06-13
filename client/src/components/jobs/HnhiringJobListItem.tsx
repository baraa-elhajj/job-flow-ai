import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ChevronDown, Terminal } from "lucide-react";
import type { HnhiringJobApiResponse } from "../../types/hnhiringJob";
import { formatRelativeTime } from "../../utils/dateFormatter";

export default function HnhiringJobListItem({
  job,
}: {
  job: HnhiringJobApiResponse;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [locationOpen, setLocationOpen] = useState(true);
  const [skillsOpen, setSkillsOpen] = useState(true);

  return (
    <div className="job-card">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <span className="badge-hn">
              <Terminal className="w-3 h-3" />
              HN Hiring
            </span>
          </div>
          <h3
            className={`text-2xl font-bold text-gruvbox-fg0 mb-1 ${showDetails ? "" : "line-clamp-2"}`}
          >
            {job.title}
          </h3>
          <p className="text-gruvbox-orange_light text-lg font-medium">
            {job.companyName}
          </p>
        </div>
      </div>

      <div
        className={`text-gruvbox-fg2 mb-4 [&_a]:text-gruvbox-orange_light [&_a:hover]:text-gruvbox-orange_light [&_a]:underline [&_a]:font-medium whitespace-pre-wrap ${
          showDetails
            ? "block [&_p]:mb-4 last:[&_p]:mb-0"
            : "line-clamp-3 [&_p]:inline"
        }`}
        dangerouslySetInnerHTML={{ __html: job.text }}
      />

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showDetails
            ? "grid-rows-[1fr] opacity-100 mb-4"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden mt-4">
          {job.location && job.location.length > 0 && (
            <div className="mb-4 bg-gruvbox-bg1/50 p-3 rounded-lg border border-gruvbox-bg3/50">
              <button
                type="button"
                onClick={() => setLocationOpen((o) => !o)}
                className="flex items-center gap-2 w-full text-left group"
              >
                <MapPin className="w-4 h-4 text-gruvbox-aqua" />
                <p className="text-gruvbox-fg4 text-xs uppercase tracking-wider font-semibold group-hover:text-gruvbox-fg2 transition-colors">
                  Location
                </p>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gruvbox-gray transition-transform duration-300 ${
                    locationOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  locationOpen
                    ? "grid-rows-[1fr] opacity-100 mt-3"
                    : "grid-rows-[0fr] opacity-0 mt-0"
                }`}
              >
                <div className="overflow-hidden">
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {job.skills && job.skills.length > 0 && (
            <div className="mb-4 bg-gruvbox-bg1/50 p-3 rounded-lg border border-gruvbox-bg3/50">
              <button
                type="button"
                onClick={() => setSkillsOpen((o) => !o)}
                className="flex items-center gap-2 w-full text-left group"
              >
                <p className="text-gruvbox-fg4 text-xs uppercase tracking-wider font-semibold group-hover:text-gruvbox-fg2 transition-colors">
                  Required Skills
                </p>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gruvbox-gray transition-transform duration-300 ${
                    skillsOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  skillsOpen
                    ? "grid-rows-[1fr] opacity-100 mt-3"
                    : "grid-rows-[0fr] opacity-0 mt-0"
                }`}
              >
                <div className="overflow-hidden">
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
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
          {formatRelativeTime(job.datePosted)}
        </span>
        <Link
          to={`/jobs/${job._id}`}
          className="inline-block px-6 py-2 bg-gruvbox-orange hover:bg-gruvbox-orange_light text-white rounded-lg transition font-semibold"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
