import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Video, Youtube, Settings, TrendingUp } from 'lucide-react';
import PromptCard from '../components/admin/PromptCard';

type AdminCard = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  accentColor: 'purple' | 'red' | 'blue';
};

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  const adminCards: AdminCard[] = [
    {
      id: 'youtube-tiktok-analysis',
      title: 'Video Platform Analysis Prompts',
      description: 'Configure master prompts for YouTube and TikTok content analysis with dynamic variables',
      icon: <TrendingUp className="w-6 h-6" />,
      route: '/admin/prompts/platform-analysis',
      accentColor: 'purple',
    },
    {
      id: 'channel-analysis',
      title: 'YouTube Channel Analysis Prompts',
      description: 'Manage master prompts for comprehensive YouTube channel evaluation and insights',
      icon: <Youtube className="w-6 h-6" />,
      route: '/admin/prompts/channel-analysis',
      accentColor: 'red',
    },
    {
      id: 'video-creation',
      title: 'AI Video Creation Prompts',
      description: 'Edit master prompts for AI-powered video content generation and scripting',
      icon: <Video className="w-6 h-6" />,
      route: '/admin/prompts/video-creation',
      accentColor: 'blue',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="w-full px-9 py-8 mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage master prompts and system configurations</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Sparkles className="w-4 h-4" />
            <span>Configure AI behavior with dynamic variables using <code className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded text-xs border border-slate-200 dark:border-slate-700">[VARIABLE_NAME]</code> syntax</span>
          </div>
        </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminCards.map((c) => (
            <PromptCard
              key={c.id}
              title={c.title}
              description={c.description}
              icon={c.icon}
              accentColor={c.accentColor}
              onClick={() => navigate(c.route)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
