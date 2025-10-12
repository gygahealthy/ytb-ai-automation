import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import iconImage from "../../../assets/icon.png";

interface LogoProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Logo: React.FC<LogoProps> = ({ isCollapsed, onToggleCollapse }) => {
  return (
    <div
      className={clsx(
        "h-20 flex items-center border-b border-gray-200 dark:border-gray-700 relative justify-center",
        isCollapsed ? " px-2" : " px-4"
      )}
    >
      <img src={iconImage} alt="VEO3 Icon" className="h-12 w-12 object-contain" />
      {!isCollapsed && <span className="text-xl font-bold text-gray-900 dark:text-white">VEO3 AUTO</span>}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>
    </div>
  );
};

export default Logo;
