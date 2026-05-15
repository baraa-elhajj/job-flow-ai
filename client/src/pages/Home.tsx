import JobsList from "./JobsList";
import { useNavigate } from "react-router-dom";

export default function Home({ source }: { source: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gruvbox-bg transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 md:pt-12 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 border-b border-gruvbox-bg3/20 pb-6">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gruvbox-fg0 mb-3 tracking-tight">
              JobFlow <span className="text-gruvbox-orange">AI</span>
            </h1>
            <p className="text-gruvbox-fg4 text-base sm:text-lg max-w-2xl leading-relaxed">
              The ultimate aggregator for high-signal tech opportunities.
              Parsed with AI, delivered to you.
            </p>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="flex bg-gruvbox-bg1/50 border border-gruvbox-bg3/30 rounded-xl p-1 shadow-sm overflow-x-auto no-scrollbar max-w-full">
              {[
                { id: "all", label: "ALL Jobs", path: "/" },
                { id: "hnhiring", label: "HN Hiring", path: "/hnhiring" },
                { id: "linkedin", label: "LinkedIn", path: "/linkedin" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => navigate(filter.path)}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 whitespace-nowrap ${
                    source === filter.id
                      ? "bg-gruvbox-orange text-white shadow-md"
                      : "text-gruvbox-fg4 hover:text-gruvbox-fg2 hover:bg-gruvbox-bg2/50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <JobsList source={source} />
      </div>
    </div>
  );
}

