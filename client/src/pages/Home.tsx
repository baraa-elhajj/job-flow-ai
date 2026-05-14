import { useState } from "react";
import JobsList from "./JobsList";
import LinkedInJobsList from "./LinkedInJobsList";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"hn" | "linkedin">("hn");

  return (
    <div className="min-h-screen bg-gruvbox-bg">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-gruvbox-bg3/30 pb-6">
          <div>
            <h1 className="text-5xl font-extrabold text-gruvbox-fg0 mb-4 tracking-tight">
              JobFlow <span className="text-gruvbox-orange">AI</span>
            </h1>
            <p className="text-gruvbox-fg4 text-lg max-w-2xl leading-relaxed">
              The ultimate aggregator for high-signal tech opportunities.
              Aggregated from across the web, parsed with AI.
            </p>
          </div>

          <div className="flex bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-xl p-1.5 shadow-inner">
            <button
              onClick={() => setActiveTab("hn")}
              className={`px-8 py-2.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === "hn"
                  ? "bg-gruvbox-orange text-gruvbox-bg0_h shadow-md scale-[1.02]"
                  : "text-gruvbox-fg4 hover:text-gruvbox-fg2 hover:bg-gruvbox-bg2/50"
              }`}
            >
              HN Hiring
            </button>
            <button
              onClick={() => setActiveTab("linkedin")}
              className={`px-8 py-2.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === "linkedin"
                  ? "bg-gruvbox-orange text-gruvbox-bg0_h shadow-md scale-[1.02]"
                  : "text-gruvbox-fg4 hover:text-gruvbox-fg2 hover:bg-gruvbox-bg2/50"
              }`}
            >
              LinkedIn
            </button>
          </div>
        </div>
      </div>

      <div className="transition-all duration-300">
        {activeTab === "hn" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <JobsList hideHeader={true} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LinkedInJobsList hideHeader={true} />
          </div>
        )}
      </div>
    </div>
  );
}
