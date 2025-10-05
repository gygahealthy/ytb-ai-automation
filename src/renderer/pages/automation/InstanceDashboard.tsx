import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Settings, StopCircle, Loader2, MessageSquare } from 'lucide-react';
import { InstanceState, LaunchInstanceRequest } from '../../../types/automation.types';

export default function InstanceDashboard() {
  const navigate = useNavigate();
  const [instances, setInstances] = useState<InstanceState[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [provider, setProvider] = useState<'chatgpt' | 'gemini'>('gemini');
  const [isLaunching, setIsLaunching] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadProfiles();
    loadInstances();
    loadConfig();
  }, []);

  // Setup event listeners
  useEffect(() => {
    const unsubRegistered = window.electronAPI.automation.onInstanceRegistered((instance: InstanceState) => {
      setInstances(prev => {
        // avoid duplicates: if instanceId already exists, replace it
        const exists = prev.find(i => i.instanceId === instance.instanceId);
        if (exists) {
          return prev.map(i => i.instanceId === instance.instanceId ? instance : i);
        }
        return [...prev, instance];
      });
    });

    const unsubUpdated = window.electronAPI.automation.onInstanceUpdated((instance: InstanceState) => {
      setInstances(prev => prev.map(i => i.instanceId === instance.instanceId ? instance : i));
    });

    const unsubStatus = window.electronAPI.automation.onInstanceStatus((data: any) => {
      setInstances(prev => prev.map(i => 
        i.instanceId === data.instanceId 
          ? { ...i, status: data.status, errorMessage: data.errorMessage }
          : i
      ));
    });

    const unsubUnregistered = window.electronAPI.automation.onInstanceUnregistered((instanceId: string) => {
      setInstances(prev => prev.filter(i => i.instanceId !== instanceId));
    });

    return () => {
      try { unsubRegistered(); } catch {};
      try { unsubUpdated(); } catch {};
      try { unsubStatus(); } catch {};
      try { unsubUnregistered(); } catch {};
    };
  }, []);

  const loadProfiles = async () => {
    const res = await window.electronAPI.profile.getAll();
    if (res?.success && res.data) {
      setProfiles(res.data.map((p: any) => ({ id: p.id, name: p.name })));
      if (res.data.length > 0) {
        setSelectedProfileId(res.data[0].id);
      }
    }
  };

  const loadInstances = async () => {
    // use multi-instance specific API
    const res = await window.electronAPI.automation.getInstances();
    if (res?.success && res.data) {
      // dedupe by instanceId just in case the backend emitted duplicates
      const unique: Record<string, InstanceState> = {};
      res.data.forEach((inst: InstanceState) => {
        unique[inst.instanceId] = inst;
      });
      setInstances(Object.values(unique));
    }
  };

  const loadConfig = async () => {
    const res = await window.electronAPI.automation.getConfig();
    if (res?.success && res.data) {
      setConfig(res.data);
    }
  };

  const handleLaunch = async () => {
    if (!selectedProfileId) return;

    setIsLaunching(true);
    try {
      // If this is the first instance to be launched, force the layout to 1x2-vertical
      const isFirstInstance = instances.length === 0;
      if (isFirstInstance) {
        try {
          await applyPresetAndRefresh('1x2-vertical');
        } catch (err) {
          console.warn('Failed to apply default 1x2-vertical preset before first launch', err);
        }
      }
      const request: LaunchInstanceRequest = {
        profileId: selectedProfileId,
        automationType: 'chat',
        provider,
      };

      const res = await window.electronAPI.automation.launch(request);
      if (!res.success) {
        alert(res.error || 'Failed to launch instance');
      }
      // After launching the very first instance, ensure windows are repositioned/resized
      if (isFirstInstance) {
        try {
          // repositionAll will instruct the main process to place windows according to the current grid
          await window.electronAPI.automation.repositionAll();
          // refresh config to ensure UI shows the active preset
          const conf = await window.electronAPI.automation.getConfig();
          if (conf?.success) setConfig(conf.data);
        } catch (err) {
          console.warn('Failed to reposition windows after first launch', err);
        }
      }
    } catch (error) {
      console.error('Launch error:', error);
      alert('Failed to launch instance');
    } finally {
      setIsLaunching(false);
    }
  };

  const handleStopInstance = async (instanceId: string) => {
    await window.electronAPI.automation.stopInstance(instanceId);
  };

  const handleStopAll = async () => {
    if (confirm(`Stop all ${instances.length} running instances?`)) {
      await window.electronAPI.automation.stopAll();
    }
  };

  const handleNavigateToDetail = (instanceId: string, page: 'chat' | 'video') => {
    navigate(`/automation/${instanceId}/${page}`);
  };


  const getProfileName = (profileId: string) => {
    return profiles.find(p => p.id === profileId)?.name || profileId;
  };

  // ...existing code...

  // Calculate grid layout based on config
  const gridColumns = config?.grid?.columns || 3;
  const gridRows = config?.grid?.rows || 2;

  // build a slot map for rendering the slot grid
  const slotMap: Record<number, InstanceState | null> = {};
  for (let i = 0; i < (gridColumns * gridRows); i++) slotMap[i] = null;
  instances.forEach(inst => {
    if (typeof inst.screenSlot === 'number' && inst.screenSlot >= 0 && inst.screenSlot < gridColumns * gridRows) {
      slotMap[inst.screenSlot] = inst;
    }
  });

  const applyPresetAndRefresh = async (preset: string) => {
    try {
      await window.electronAPI.automation.applyPreset(preset);
      const res = await window.electronAPI.automation.getConfig();
      if (res?.success) setConfig(res.data);
    } catch (err) {
      console.error('Failed to apply preset', err);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Instance Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage multiple automation instances
          </p>
        </div>

        <button
          onClick={() => navigate('/automation/settings')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Toolbar */}
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
            onClick={handleLaunch}
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

          {instances.length > 0 && (
            <button
              onClick={handleStopAll}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
            >
              <StopCircle className="w-4 h-4" />
              Stop All ({instances.length})
            </button>
          )}

          {/* Layout preset icons - positioned to the right */}
          <div className="ml-auto flex items-center gap-2">
            {/* Preset quick picker (visual) */}
            <div className="flex items-center gap-2 relative">
              {/* Detect active preset */}
              {(() => {
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

                return (
                  <>
                    <button
                      title="1x1 (fullscreen each)"
                      onMouseEnter={() => setPreview('1x1')}
                      onMouseLeave={() => setPreview(null)}
                      onClick={async () => { await applyPresetAndRefresh('1x1'); }}
                      className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${activePreset === '1x1' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="1.5"/></svg>
                    </button>
                    <button
                      title="1x2 (vertical)"
                      onMouseEnter={() => setPreview('1x2-vertical')}
                      onMouseLeave={() => setPreview(null)}
                      onClick={async () => { await applyPresetAndRefresh('1x2-vertical'); }}
                      className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${activePreset === '1x2-vertical' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      {/* vertical = stacked (one column, two rows) */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="8" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="13" width="18" height="8" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/></svg>
                    </button>
                    <button
                      title="1x2 (horizontal)"
                      onMouseEnter={() => setPreview('1x2-horizontal')}
                      onMouseLeave={() => setPreview(null)}
                      onClick={async () => { await applyPresetAndRefresh('1x2-horizontal'); }}
                      className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${activePreset === '1x2-horizontal' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      {/* horizontal = side-by-side (two columns, one row) */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="8" height="18" stroke="currentColor" strokeWidth="1.5"/><rect x="13" y="3" width="8" height="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/></svg>
                    </button>
                    <button
                      title="2x2"
                      onMouseEnter={() => setPreview('2x2')}
                      onMouseLeave={() => setPreview(null)}
                      onClick={async () => { await applyPresetAndRefresh('2x2'); }}
                      className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${activePreset === '2x2' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.5"/><rect x="13" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/><rect x="13" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/></svg>
                    </button>
                    <button
                      title="4x4"
                      onMouseEnter={() => setPreview('4x4')}
                      onMouseLeave={() => setPreview(null)}
                      onClick={async () => { await applyPresetAndRefresh('4x4'); }}
                      className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${activePreset === '4x4' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="4" height="4" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="8.5" y="3" width="4" height="4" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="14" y="3" width="4" height="4" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="19.5" y="3" width="1.5" height="4" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/>
                        <rect x="3" y="8.5" width="4" height="4" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="8.5" y="8.5" width="4" height="4" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="14" y="8.5" width="4" height="4" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="19.5" y="8.5" width="1.5" height="4" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/>
                        <rect x="3" y="14" width="4" height="4" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/>
                        <rect x="8.5" y="14" width="4" height="4" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/>
                        <rect x="3" y="19.5" width="4" height="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/>
                      </svg>
                    </button>
                    <button
                      title="Cascade"
                      onMouseEnter={() => setPreview('cascade')}
                      onMouseLeave={() => setPreview(null)}
                      onClick={async () => { await applyPresetAndRefresh('cascade'); }}
                      className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${activePreset === 'cascade' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="14" height="10" stroke="currentColor" strokeWidth="1.5"/><rect x="7" y="7" width="14" height="10" stroke="currentColor" strokeWidth="1.2" opacity="0.6"/></svg>
                    </button>
                  </>
                );
              })()}

              {/* Preview popover */}
              {preview && (
                <div className="absolute -top-28 left-0 z-50 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow">
                  <LayoutPreview preset={preview} />
                </div>
              )}
            </div>

            {/* Compact / no-gap toggle */}
            <label className="ml-3 flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!config?.grid?.compact}
                onChange={async (e) => {
                  const compact = e.target.checked;
                  if (!config) return;
                  // update config
                  await window.electronAPI.automation.updateConfig({ grid: { ...config.grid, compact } });
                  // force reposition so existing windows pick up new compact spacing
                  await window.electronAPI.automation.repositionAll();
                  const res = await window.electronAPI.automation.getConfig();
                  if (res?.success) setConfig(res.data);
                }}
                className="cursor-pointer"
              />
              <span className="text-gray-500">Compact</span>
            </label>
          </div>
        </div>
      </div>

      {/* Instances Grid */}
      <div className="flex-1 overflow-auto">
        {instances.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-2">No running instances</p>
              <p className="text-sm">Select a profile and click Run to start</p>
            </div>
          </div>
        ) : (
          // Render slot-based grid showing actual screen positions; support drag/drop
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: gridColumns * gridRows }).map((_, slotIndex) => {
              const inst = slotMap[slotIndex];
              return (
                <div
                  key={`slot-${slotIndex}`}
                  className={`p-4 rounded-xl min-h-[120px] flex flex-col justify-between transition-all duration-200 ${inst ? 'bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 ring-1 ring-transparent hover:ring-primary-200/30' : 'bg-transparent border border-dashed border-gray-300 dark:border-gray-600'}`}
                  draggable={!!inst}
                  onDragStart={(e) => {
                    if (!inst) return;
                    e.dataTransfer?.setData('text/instance-id', inst.instanceId);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer?.getData('text/instance-id');
                    if (!draggedId) return;
                    // call main to move/swap
                    await (window.electronAPI.automation as any).moveInstanceToSlot(draggedId, slotIndex);
                    // refresh instances list and config
                    const res = await window.electronAPI.automation.getInstances();
                    if (res?.success) setInstances(res.data || []);
                    const conf = await window.electronAPI.automation.getConfig();
                    if (conf?.success) setConfig(conf.data);
                  }}
                >
                  {inst ? (
                    <>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="text-xs text-gray-500">Slot {slotIndex}</div>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold ring-1 ring-white/10 shadow">
                              {getProfileName(inst?.profileId || '').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">{getProfileName(inst.profileId)}</div>
                              <div className="text-xs text-gray-400 truncate">{inst.provider || inst.automationType}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${inst.status === 'running' ? 'bg-green-100 text-green-800' : inst.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{inst.status}</span>
                        </div>
                      </div>

                      <div className="mt-1 flex items-center gap-3">
                        <button
                          onClick={() => handleNavigateToDetail(inst.instanceId, 'chat')}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm shadow-sm transition"
                          aria-label="Open chat"
                        >
                          <MessageSquare className="w-4 h-4 text-white" aria-hidden />
                          <span className="font-medium">Chat</span>
                        </button>

                        <button
                          onClick={() => handleStopInstance(inst.instanceId)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 text-red-600 hover:bg-red-50 transition text-sm"
                          aria-label="Stop instance"
                        >
                          <StopCircle className="w-4 h-4 text-red-600" />
                          <span>Stop</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    // Empty slot: minimal dashed border only in dark and light
                    <div className="w-full h-full" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// InstanceCard removed: slot-grid is now the primary UI for positioning and drag/drop.

/** Small layout preview used on hover */
function LayoutPreview({ preset }: { preset: string }) {
  // Render simple scaled preview box
  if (preset === '1x1') {
    return (
      <svg width="140" height="80" viewBox="0 0 140 80" className="text-gray-700 dark:text-gray-200">
        <rect x="2" y="2" width="136" height="76" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }

  if (preset === '1x2-vertical') {
    return (
      <svg width="140" height="80" viewBox="0 0 140 80" className="text-gray-700 dark:text-gray-200">
        {/* vertical stacked (one column, two rows) */}
        <rect x="2" y="2" width="136" height="36" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x="2" y="42" width="136" height="36" stroke="currentColor" strokeWidth="1.2" opacity="0.4" fill="none" />
      </svg>
    );
  }

  if (preset === '1x2-horizontal') {
    return (
      <svg width="140" height="80" viewBox="0 0 140 80" className="text-gray-700 dark:text-gray-200">
        {/* horizontal side-by-side (two columns, one row) */}
        <rect x="2" y="2" width="66" height="76" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x="72" y="2" width="66" height="76" stroke="currentColor" strokeWidth="1.2" opacity="0.4" fill="none" />
      </svg>
    );
  }

  if (preset === '2x2') {
    return (
      <svg width="140" height="80" viewBox="0 0 140 80" className="text-gray-700 dark:text-gray-200">
        <rect x="2" y="2" width="66" height="36" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x="72" y="2" width="66" height="36" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x="2" y="42" width="66" height="36" stroke="currentColor" strokeWidth="1.2" opacity="0.4" fill="none" />
        <rect x="72" y="42" width="66" height="36" stroke="currentColor" strokeWidth="1.2" opacity="0.4" fill="none" />
      </svg>
    );
  }

  if (preset === '4x4') {
    return (
      <svg width="140" height="80" viewBox="0 0 140 80" className="text-gray-700 dark:text-gray-200">
        <rect x="2" y="2" width="32" height="17" stroke="currentColor" strokeWidth="1" fill="none" />
        <rect x="37" y="2" width="32" height="17" stroke="currentColor" strokeWidth="1" fill="none" />
        <rect x="72" y="2" width="32" height="17" stroke="currentColor" strokeWidth="1" fill="none" />
        <rect x="107" y="2" width="31" height="17" stroke="currentColor" strokeWidth="1" fill="none" />
        <rect x="2" y="22" width="32" height="17" stroke="currentColor" strokeWidth="1" fill="none" />
        <rect x="37" y="22" width="32" height="17" stroke="currentColor" strokeWidth="1" fill="none" />
        <rect x="72" y="22" width="32" height="17" stroke="currentColor" strokeWidth="1" fill="none" />
        <rect x="107" y="22" width="31" height="17" stroke="currentColor" strokeWidth="1" fill="none" />
        <rect x="2" y="42" width="32" height="17" stroke="currentColor" strokeWidth="1" opacity="0.4" fill="none" />
        <rect x="37" y="42" width="32" height="17" stroke="currentColor" strokeWidth="1" opacity="0.4" fill="none" />
        <rect x="72" y="42" width="32" height="17" stroke="currentColor" strokeWidth="1" opacity="0.4" fill="none" />
        <rect x="107" y="42" width="31" height="17" stroke="currentColor" strokeWidth="1" opacity="0.4" fill="none" />
        <rect x="2" y="62" width="32" height="16" stroke="currentColor" strokeWidth="1" opacity="0.4" fill="none" />
        <rect x="37" y="62" width="32" height="16" stroke="currentColor" strokeWidth="1" opacity="0.4" fill="none" />
        <rect x="72" y="62" width="32" height="16" stroke="currentColor" strokeWidth="1" opacity="0.4" fill="none" />
        <rect x="107" y="62" width="31" height="16" stroke="currentColor" strokeWidth="1" opacity="0.4" fill="none" />
      </svg>
    );
  }

  if (preset === 'cascade') {
    return (
      <svg width="140" height="80" viewBox="0 0 140 80" className="text-gray-700 dark:text-gray-200">
        <rect x="2" y="2" width="90" height="46" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x="18" y="18" width="90" height="46" stroke="currentColor" strokeWidth="1.2" opacity="0.6" fill="none" />
        <rect x="34" y="34" width="90" height="46" stroke="currentColor" strokeWidth="1.2" opacity="0.3" fill="none" />
      </svg>
    );
  }

  return null;
}
