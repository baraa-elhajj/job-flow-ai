import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, Search, X } from "lucide-react";

interface SearchJobsProps {
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
}

export default function SearchJobs({
  onSearchChange,
  showSearch,
}: SearchJobsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const postedAfter = searchParams.get("after") || "";
  const postedBefore = searchParams.get("before") || "";
  const [localSearch, setLocalSearch] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSearch(query);
  }, [query]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch.trim() !== query) {
        setSearchParams((prev) => {
          if (localSearch.trim()) {
            prev.set("q", localSearch.trim());
          } else {
            prev.delete("q");
          }

          prev.set("page", "1");
          return prev;
        });

        if (onSearchChange) {
          onSearchChange(localSearch.trim());
        }
      }
    }, 300); // 300ms delay (debounce)

    return () => clearTimeout(handler);
  }, [localSearch, query, setSearchParams, onSearchChange]);

  useEffect(() => {
    if (showSearch) {
      inputRef.current?.focus();
    }
  }, [showSearch]);

  const setDateFilter = (name: "after" | "before", value: string) => {
    setSearchParams((prev) => {
      if (value) {
        prev.set(name, value);
      } else {
        prev.delete(name);
      }
      prev.set("page", "1");
      return prev;
    });
  };

  const clearDateFilters = () => {
    setSearchParams((prev) => {
      prev.delete("after");
      prev.delete("before");
      prev.set("page", "1");
      return prev;
    });
  };

  return (
    <div className="mb-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gruvbox-fg4" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search jobs by title, company, or skills..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-12 pr-12 py-3 bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg text-gruvbox-fg0 placeholder-gruvbox-fg4 focus:outline-none focus:border-gruvbox-orange transition"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch("")}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gruvbox-fg4 hover:text-gruvbox-fg0 transition"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3">
        <label className="flex-1 text-xs font-semibold uppercase tracking-wider text-gruvbox-fg4">
          Posted after
          <div className="relative mt-1">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gruvbox-fg4 pointer-events-none" />
            <input
              type="date"
              value={postedAfter}
              max={postedBefore || undefined}
              onChange={(event) => setDateFilter("after", event.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg text-gruvbox-fg0 focus:outline-none focus:border-gruvbox-orange transition"
            />
          </div>
        </label>
        <label className="flex-1 text-xs font-semibold uppercase tracking-wider text-gruvbox-fg4">
          Posted before
          <div className="relative mt-1">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gruvbox-fg4 pointer-events-none" />
            <input
              type="date"
              value={postedBefore}
              min={postedAfter || undefined}
              onChange={(event) => setDateFilter("before", event.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gruvbox-bg1 border border-gruvbox-bg3 rounded-lg text-gruvbox-fg0 focus:outline-none focus:border-gruvbox-orange transition"
            />
          </div>
        </label>
        {(postedAfter || postedBefore) && (
          <button
            type="button"
            onClick={clearDateFilters}
            className="px-3 py-2 text-sm text-gruvbox-fg4 hover:text-gruvbox-fg0 transition"
          >
            Clear dates
          </button>
        )}
      </div>
      {(query || postedAfter || postedBefore) && (
        <p className="mt-2 text-sm text-gruvbox-fg4">
          {query && (
            <>
              Search results for "
              <span className="text-gruvbox-fg0 font-semibold">{query}</span>"
            </>
          )}
          {query && (postedAfter || postedBefore) && " · "}
          {postedAfter && `from ${postedAfter}`}
          {postedAfter && postedBefore && " "}
          {postedBefore && `through ${postedBefore}`}
        </p>
      )}
    </div>
  );
}
