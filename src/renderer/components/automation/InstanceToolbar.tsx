import { useEffect, useState } from 'react';
import { Play, Loader2, StopCircle } from 'lucide-react';

import { InstanceState } from '../../../shared/types';

interface Props {
  profiles: { id: string; name: string }[];
  selectedProfileId: string;
  setSelectedProfileId: (id: string) => void;
  provider: 'chatgpt' | 'gemini';
  setProvider: (p: 'chatgpt' | 'gemini') => void;
  isLaunching: boolean;
  instancesCount: number;
  instances: InstanceState[];
  onLaunch: () => Promise<void>;
  onStopAll: () => Promise<void>;
  applyPresetAndRefresh: (preset: string) => Promise<void>;
  updateCompact: (compact: boolean) => Promise<void>;
  config: any;
}

export default function InstanceToolbar({
  profiles,
  selectedProfileId,
  setSelectedProfileId,
  provider,
  setProvider,
  isLaunching,
  instancesCount,
  instances,
  onLaunch,
  onStopAll,
  applyPresetAndRefresh,
  updateCompact,
  config,
}: Props) {
  const [overridePreset, setOverridePreset] = useState<string | null>(null);

  // Clear override only when the authoritative activePreset equals the override
  useEffect(() => {
    if (!overridePreset) return;
    try {
      if (overridePreset === activePreset) {
        setOverridePreset(null);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, overridePreset]);
  // derive active preset from config to avoid mismatches
  const cols = config?.grid?.columns || 3;
  const rows = config?.grid?.rows || 2;
  const strategy = config?.strategy || 'grid';
  const fullscreen = config?.grid?.fullscreenEach || false;

  let activePreset = '';
  if (strategy === 'cascade') activePreset = 'cascade';
  else if (fullscreen && cols === 1 && rows === 1) activePreset = '1x1';
  else if (cols === 1 && rows === 2) activePreset = '1x2-vertical';
  else if (cols === 2 && rows === 1) activePreset = '1x2-horizontal';
  else if (cols === 2 && rows === 2) activePreset = '2x2';
  else if (cols === 4 && rows === 4) activePreset = '4x4';

  // Fallback: when config suggests horizontal but actual window bounds indicate vertical (or vice versa), prefer the observed orientation.
  try {
    const first = (config && (Array.isArray((config as any).instances) ? (config as any).instances[0] : null)) || null;
    // Prefer using the passed instances prop if available
    if (!first && (instances && instances.length > 0)) {
      const b = instances[0].windowBounds;
      if (b && activePreset === '1x2-horizontal' && b.height > b.width) activePreset = '1x2-vertical';
      if (b && activePreset === '1x2-vertical' && b.width > b.height) activePreset = '1x2-horizontal';
    }
  } catch (e) {
    // ignore
  }

  // If user just clicked a preset, respect it immediately until config refresh arrives
  const displayedPreset = overridePreset || activePreset;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center gap-4">
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        >
          <option value="">Select Profile</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as 'chatgpt' | 'gemini')}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        >
          <option value="gemini">Gemini</option>
          <option value="chatgpt">ChatGPT</option>
        </select>

        <button
          onClick={onLaunch}
          disabled={!selectedProfileId || isLaunching}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLaunching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Launching...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run
            </>
          )}
        </button>

        {instancesCount > 0 && (
          <button
            onClick={onStopAll}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
          >
            <StopCircle className="w-4 h-4" />
            Stop All ({instancesCount})
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 relative">
            <button
              title="1x1 (fullscreen each)"
              onClick={async () => { setOverridePreset('1x1'); await applyPresetAndRefresh('1x1'); }}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${displayedPreset === '1x1' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
            <button
              title="1 x 2 — 1 column × 2 rows (vertical)"
              onClick={async () => { setOverridePreset('1x2-vertical'); await applyPresetAndRefresh('1x2-vertical'); }}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${displayedPreset === '1x2-vertical' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="8" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="13" width="18" height="8" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/></svg>
            </button>
            <button
              title="2 x 1 — 2 columns × 1 row (horizontal)"
              onClick={async () => { setOverridePreset('1x2-horizontal'); await applyPresetAndRefresh('1x2-horizontal'); }}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${displayedPreset === '1x2-horizontal' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="8" height="18" stroke="currentColor" strokeWidth="1.5"/><rect x="13" y="3" width="8" height="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/></svg>
            </button>
            <button
              title="2x2"
              onClick={async () => { setOverridePreset('2x2'); await applyPresetAndRefresh('2x2'); }}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${displayedPreset === '2x2' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.5"/><rect x="13" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/><rect x="13" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/></svg>
            </button>
            <button
              title="4x4"
              onClick={async () => { setOverridePreset('4x4'); await applyPresetAndRefresh('4x4'); }}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${displayedPreset === '4x4' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="4" height="4" stroke="currentColor" strokeWidth="1.2"/><rect x="8.5" y="3" width="4" height="4" stroke="currentColor" strokeWidth="1.2"/><rect x="14" y="3" width="4" height="4" stroke="currentColor" strokeWidth="1.2"/><rect x="19.5" y="3" width="1.5" height="4" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/></svg>
            </button>
            <button
              title="Cascade"
              onClick={async () => { setOverridePreset('cascade'); await applyPresetAndRefresh('cascade'); }}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${config?.strategy === 'cascade' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="14" height="10" stroke="currentColor" strokeWidth="1.5"/><rect x="7" y="7" width="14" height="10" stroke="currentColor" strokeWidth="1.2" opacity="0.6"/></svg>
            </button>
          </div>

          <label className="ml-3 flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!!config?.grid?.compact}
              onChange={async (e) => {
                const compact = e.target.checked;
                await updateCompact(compact);
              }}
              className="cursor-pointer"
            />
            <span className="text-gray-500">Compact</span>
          </label>
        </div>
      </div>
    </div>
  );
}
