import { useMemo, useState } from "react";
import {
  MapPin,
  ChevronDown,
  Briefcase,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import type { BaytJobApiResponse } from "../../types/baytJob";
import { formatRelativeTime } from "../../utils/dateFormatter";
import { sanitizeStructuredHtml } from "../../utils/sanitizeHtml";
import type { JobActions } from "./JobsListItemRow";

export default function BaytJobListItem({
  job,
  actions,
}: {
  job: BaytJobApiResponse;
  actions: JobActions;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [locationOpen, setLocationOpen] = useState(true);

  const company = job.companyName ?? "Unknown Company";
  const displayDescription = useMemo(
    () =>
      sanitizeStructuredHtml(job.text ?? "<p>No description provided</p>"),
    [job.text],
  );
  const locations = job.location ? [job.location] : [];
  const datePosted = job.datePosted;

  return (
    <div
      className={`job-card transition-all duration-300 ${
        actions.isApplied
          ? "opacity-40 pointer-events-none hover:opacity-60 [&_a]:pointer-events-auto [&_button]:pointer-events-auto"
          : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-3">
            <span className="badge-bayt">
              <Briefcase className="w-3 h-3" />
              Bayt
            </span>
          </div>
          <h3
            className={`text-xl sm:text-2xl font-bold text-gruvbox-fg0 mb-1 break-words ${showDetails ? "" : "line-clamp-2"}`}
          >
            {job.title}
          </h3>
          <p className="text-gruvbox-orange_light text-base sm:text-lg font-medium break-words">
            {company}
          </p>
        </div>
      </div>

      <div
        className={`job-prose text-gruvbox-fg2 mb-4 leading-relaxed [&_a]:text-gruvbox-orange_light [&_a:hover]:text-gruvbox-orange_light [&_a]:underline [&_a]:font-medium [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gruvbox-fg0 [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-base sm:[&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gruvbox-fg1 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_li]:mb-1 ${
          showDetails
            ? "block last:[&_p]:mb-0"
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
          {locations.length > 0 && (
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
                    {locations.map((loc, idx) => (
                      <span
                        key={`loc-${idx}`}
                        className="px-3 py-1 text-sm bg-gruvbox-aqua/20 text-gruvbox-aqua_light rounded-full border border-gruvbox-aqua/30 flex items-center gap-1.5 break-words max-w-full"
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

      <div className="job-card-footer">
        <span className="text-sm text-gruvbox-gray shrink-0">
          {formatRelativeTime(datePosted)}
        </span>

        <div className="job-card-actions">
          <button
            type="button"
            onClick={actions.hideJob}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gruvbox-gray hover:text-gruvbox-fg0 bg-gruvbox-bg1 hover:bg-gruvbox-bg2 rounded-lg transition border border-gruvbox-bg3/50"
          >
            {actions.isHidden ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            <span>{actions.isHidden ? "Restore" : "Hide"}</span>
          </button>

          <button
            type="button"
            onClick={actions.toggleApplied}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition border border-gruvbox-bg3/50 ${
              actions.isApplied
                ? "bg-gruvbox-aqua/20 text-gruvbox-aqua_light border-gruvbox-aqua/40"
                : "bg-gruvbox-bg1 text-gruvbox-gray hover:text-gruvbox-fg0 hover:bg-gruvbox-bg2"
            }`}
          >
            <Check
              className={`w-4 h-4 transition-transform ${actions.isApplied ? "scale-110" : ""}`}
            />
            <span>{actions.isApplied ? "Applied" : "Mark Applied"}</span>
          </button>

          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 sm:px-6 py-2 bg-gruvbox-orange hover:bg-gruvbox-orange_light text-white rounded-lg transition font-semibold text-sm sm:text-base"
          >
            Apply Now
          </a>
        </div>
      </div>
    </div>
  );
}
