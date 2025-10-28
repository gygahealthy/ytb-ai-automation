import React, { useState } from "react";
import { Calendar, X } from "lucide-react";

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onDateRangeChange: (startDate?: string, endDate?: string) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onDateRangeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localStartDate, setLocalStartDate] = useState(startDate || "");
  const [localEndDate, setLocalEndDate] = useState(endDate || "");

  const handleApply = () => {
    onDateRangeChange(
      localStartDate || undefined,
      localEndDate || undefined
    );
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalStartDate("");
    setLocalEndDate("");
    onDateRangeChange(undefined, undefined);
    setIsOpen(false);
  };

  const hasDateRange = startDate || endDate;

  const formatDateLabel = () => {
    if (!startDate && !endDate) return "All dates";
    if (startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    }
    if (startDate) return `From ${new Date(startDate).toLocaleDateString()}`;
    if (endDate) return `Until ${new Date(endDate).toLocaleDateString()}`;
    return "All dates";
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          hasDateRange
            ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
            : "text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span>{formatDateLabel()}</span>
        {hasDateRange && (
          <X
            className="w-4 h-4 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 z-30 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[320px]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  max={localEndDate || undefined}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={localEndDate}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  min={localStartDate || undefined}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Quick Filters */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick filters</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split("T")[0];
                      setLocalStartDate(today);
                      setLocalEndDate(today);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      const dateStr = yesterday.toISOString().split("T")[0];
                      setLocalStartDate(dateStr);
                      setLocalEndDate(dateStr);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const lastWeek = new Date();
                      lastWeek.setDate(lastWeek.getDate() - 7);
                      setLocalStartDate(lastWeek.toISOString().split("T")[0]);
                      setLocalEndDate(today.toISOString().split("T")[0]);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Last 7 days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const lastMonth = new Date();
                      lastMonth.setDate(lastMonth.getDate() - 30);
                      setLocalStartDate(lastMonth.toISOString().split("T")[0]);
                      setLocalEndDate(today.toISOString().split("T")[0]);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Last 30 days
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleClear}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Clear
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangePicker;
