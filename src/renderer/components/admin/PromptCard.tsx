import React from 'react';
import { ChevronRight } from 'lucide-react';

interface PromptCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  accentColor?: 'purple' | 'red' | 'blue';
}

const PromptCard: React.FC<PromptCardProps> = ({ 
  title, 
  description, 
  icon, 
  onClick,
  accentColor = 'purple'
}) => {
  const accentColors = {
    purple: {
      iconBg: 'bg-purple-50 dark:bg-purple-500/10',
      iconText: 'text-purple-600 dark:text-purple-400',
      linkText: 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300',
      hoverGlow: 'group-hover:shadow-purple-100/50 dark:group-hover:shadow-purple-500/20',
    },
    red: {
      iconBg: 'bg-red-50 dark:bg-red-500/10',
      iconText: 'text-red-600 dark:text-red-400',
      linkText: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
      hoverGlow: 'group-hover:shadow-red-100/50 dark:group-hover:shadow-red-500/20',
    },
    blue: {
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      iconText: 'text-blue-600 dark:text-blue-400',
      linkText: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
      hoverGlow: 'group-hover:shadow-blue-100/50 dark:group-hover:shadow-blue-500/20',
    },
  };

  const colors = accentColors[accentColor];

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`group cursor-pointer rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-lg ${colors.hoverGlow} transition-all duration-300 p-6 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:focus:ring-purple-400/50`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl ${colors.iconBg} flex items-center justify-center ${colors.iconText} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            {description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className={`text-sm font-medium ${colors.linkText} transition-colors`}>
              Configure Prompts
            </span>
            <ChevronRight className={`w-4 h-4 ${colors.iconText} group-hover:translate-x-1 transition-transform duration-300`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;
