import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, Grid3x3, List, Search, Tag } from "lucide-react";

type Props = {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedTags: string[];
  toggleTagFilter: (tag: string) => void;
  allTags: string[];
  columnVisibility: Record<string, boolean>;
  toggleColumnVisibility: (column: string) => void;
  viewMode: "table" | "grid";
  setViewMode: (m: "table" | "grid") => void;
};

export default function ProfilesToolbar({
  searchQuery,
  setSearchQuery,
  selectedTags,
  toggleTagFilter,
  allTags,
  columnVisibility,
  toggleColumnVisibility,
  viewMode,
  setViewMode,
}: Props) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const filterDropdownRef = useRef<HTMLDivElement | null>(null);
  const columnDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
      if (
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(event.target as Node)
      ) {
        setShowColumnSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search Bar */}
      <div className="flex-1 w-full relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search profiles..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      {/* Filter Button */}
      <div className="relative" ref={filterDropdownRef}>
        <button
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${
            selectedTags.length > 0
              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
              : "bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/50"
          }`}
        >
          <Tag className="w-4 h-4" />
          Tags
          {selectedTags.length > 0 && (
            <span className="bg-indigo-600 text-white rounded-full px-1.5 py-0 text-xs font-bold">
              {selectedTags.length}
            </span>
          )}
        </button>

        {/* Filter Dropdown */}
        {showFilterDropdown && (
          <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Filter by Tags
                </span>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() =>
                      selectedTags.forEach((t) => toggleTagFilter(t))
                    }
                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {allTags.length > 0 ? (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {allTags.map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center gap-3 p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTagFilter(tag)}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {tag}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-3">
                  No tags available
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Column Visibility */}
      <div className="relative" ref={columnDropdownRef}>
        <button
          onClick={() => setShowColumnSettings(!showColumnSettings)}
          className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/50 rounded-lg transition-all font-medium text-sm"
        >
          <Eye className="w-4 h-4" />
          Columns
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* Column Settings Dropdown */}
        {showColumnSettings && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
            <div className="p-3 space-y-1 max-h-72 overflow-y-auto">
              {Object.entries(columnVisibility).map(([column, visible]) => (
                <label
                  key={column}
                  className="flex items-center gap-3 p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggleColumnVisibility(column)}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {column}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setViewMode("table")}
          className={`p-2 rounded transition-all font-medium text-sm ${
            viewMode === "table"
              ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          title="Table View"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded transition-all font-medium text-sm ${
            viewMode === "grid"
              ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          title="Grid View"
        >
          <Grid3x3 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
