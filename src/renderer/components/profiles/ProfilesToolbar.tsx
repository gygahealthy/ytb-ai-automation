import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Eye,
  Grid3x3,
  List,
  Plus,
  Search,
  Tag,
} from "lucide-react";

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
  onNewProfile: () => void;
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
  onNewProfile,
}: Props) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const filterDropdownRef = useRef<HTMLDivElement | null>(null);
  const columnDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setShowColumnSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4">
      {/* Search Bar */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search profiles by name, ID, or path..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none"
        />
      </div>

      {/* Filter Button */}
      <div className="relative" ref={filterDropdownRef}>
        <button
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            selectedTags.length > 0
              ? "bg-primary-500 text-white border-primary-500"
              : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <Tag className="w-5 h-5" />
          Filter by Tags
          {selectedTags.length > 0 && (
            <span className="bg-white text-primary-500 rounded-full px-2 py-0.5 text-xs font-bold">{selectedTags.length}</span>
          )}
        </button>

        {/* Filter Dropdown */}
        {showFilterDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Filter by Tags
                </span>
                {selectedTags.length > 0 && (
                  <button onClick={() => selectedTags.forEach((t) => toggleTagFilter(t))} className="text-xs text-red-600 hover:text-red-700">
                    Clear
                  </button>
                )}
              </div>
              {allTags.length > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {allTags.map((tag) => (
                    <label key={tag} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input type="checkbox" checked={selectedTags.includes(tag)} onChange={() => toggleTagFilter(tag)} className="rounded" />
                      <span className="text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No tags available</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Column Visibility */}
      <div className="relative" ref={columnDropdownRef}>
        <button
          onClick={() => setShowColumnSettings(!showColumnSettings)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Eye className="w-5 h-5" />
          Columns
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Column Settings Dropdown */}
        {showColumnSettings && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10">
            <div className="p-3 space-y-1">
              {Object.entries(columnVisibility).map(([column, visible]) => (
                <label key={column} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <input type="checkbox" checked={visible} onChange={() => toggleColumnVisibility(column)} className="rounded" />
                  <span className="text-sm capitalize">{column}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("table")}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === "table" ? "bg-primary-500 text-white" : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
          title="Table View"
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === "grid" ? "bg-primary-500 text-white" : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
          title="Grid View"
        >
          <Grid3x3 className="w-5 h-5" />
        </button>
      </div>

      {/* New Profile button */}
      <div className="ml-auto sm:ml-0 sm:self-start">
        <button
          onClick={onNewProfile}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          New Profile
        </button>
      </div>
    </div>
  );
}
