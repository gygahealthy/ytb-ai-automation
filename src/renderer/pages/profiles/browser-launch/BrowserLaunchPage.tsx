import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Play, Settings, Info, X } from "lucide-react";
import { useAlert } from "@hooks/useAlert";
import { useConfirm } from "@hooks/useConfirm";
import InstanceCard from "@components/profiles/browser-launch/InstanceCard";
import InstanceToolbar from "@components/profiles/browser-launch/InstanceToolbar";
import { InstanceState, LaunchInstanceRequest } from "@/shared/types";

export default function BrowserLaunchPage() {
  const alertApi = useAlert();
  const confirm = useConfirm();
  const navigate = useNavigate();
  // Read optional profileId param from the route
  const { profileId: routeProfileIdParam } = useParams<{ profileId?: string }>();
  const [instances, setInstances] = useState<InstanceState[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [provider, setProvider] = useState<"chatgpt" | "gemini">("gemini");
  const [isLaunching, setIsLaunching] = useState(false);
  const [config, setConfig] = useState<any>(null);
  // Hint visibility (persisted)
  const HINT_KEY = "veo3-browser-launch-hint-hidden";
  const [showHint, setShowHint] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HINT_KEY) !== "1";
    } catch (e) {
      return true;
    }
  });
  // preview handled in toolbar component

  // Load initial data
  useEffect(() => {
    loadProfiles();
    loadInstances();
    loadConfig();
  }, []);
  const loadProfiles = async () => {
    const res = await window.electronAPI.profile.getAll();
    if (res?.success && res.data) {
      const list = res.data.map((p: any) => ({ id: p.id, name: p.name }));
      setProfiles(list);

      // If a profileId was passed in the route params, prefer that as the selected profile
      if (routeProfileIdParam) {
        // ensure the passed id exists in the list
        const exists = list.find((p: any) => p.id === routeProfileIdParam);
        if (exists) setSelectedProfileId(routeProfileIdParam);
        else if (list.length > 0) setSelectedProfileId(list[0].id);
      } else {
        if (list.length > 0) setSelectedProfileId(list[0].id);
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
      // If this is the first instance to be launched, force the layout to 1x1 (fullscreen)
      const isFirstInstance = instances.length === 0;
      if (isFirstInstance) {
        try {
          await applyPresetAndRefresh("1x1");
        } catch (err) {
          console.warn("Failed to apply default 1x2-vertical preset before first launch", err);
        }
      }
      const request: LaunchInstanceRequest = {
        profileId: selectedProfileId,
        automationType: "chat",
        provider,
      };

      const res = await window.electronAPI.automation.launch(request);
      if (!res.success) {
        alertApi.show({ message: res.error || "Failed to launch instance", title: "Launch Error" });
      } else {
        // If launch returned instance info (new or existing), refresh instances list.
        const returnedId = res.data?.instanceId;
        if (returnedId) {
          try {
            const list = await window.electronAPI.automation.getInstances();
            if (list?.success && list.data) setInstances(list.data || []);
          } catch (e) {}
          // NOTE: intentionally do NOT navigate to the chat page after Run.
        }
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
          console.warn("Failed to reposition windows after first launch", err);
        }
      }
    } catch (error) {
      console.error("Launch error:", error);
      alertApi.show({ message: "Failed to launch instance", title: "Launch Error" });
    } finally {
      setIsLaunching(false);
    }
  };

  const handleStopInstance = async (instanceId: string) => {
    try {
      await window.electronAPI.automation.stopInstance(instanceId);
      // refresh instances list and config
      const res = await window.electronAPI.automation.getInstances();
      if (res?.success) setInstances(res.data || []);
      const conf = await window.electronAPI.automation.getConfig();
      if (conf?.success) setConfig(conf.data);
    } catch (err) {
      console.error("Failed to stop instance", err);
    }
  };

  const handleStopAll = async () => {
    if (await confirm({ message: `Stop all ${instances.length} running instances?` })) {
      try {
        await window.electronAPI.automation.stopAll();
        // refresh instances list and config
        const res = await window.electronAPI.automation.getInstances();
        if (res?.success) setInstances(res.data || []);
        const conf = await window.electronAPI.automation.getConfig();
        if (conf?.success) setConfig(conf.data);
      } catch (err) {
        console.error("Failed to stop all instances", err);
      }
    }
  };

  const handleNavigateToDetail = (instanceId: string, page: "chat" | "video") => {
    navigate(`/automation/${instanceId}/${page}`);
  };

  const getProfileName = (profileId: string) => {
    return profiles.find((p) => p.id === profileId)?.name || profileId;
  };

  // ...existing code...

  // Calculate grid layout based on config
  const gridColumns = config?.grid?.columns || 3;
  const gridRows = config?.grid?.rows || 2;

  // build a slot map for rendering the slot grid
  const slotMap: Record<number, InstanceState | null> = {};
  for (let i = 0; i < gridColumns * gridRows; i++) slotMap[i] = null;
  instances.forEach((inst) => {
    if (typeof inst.screenSlot === "number" && inst.screenSlot >= 0 && inst.screenSlot < gridColumns * gridRows) {
      slotMap[inst.screenSlot] = inst;
    }
  });

  const applyPresetAndRefresh = async (preset: string) => {
    // Guard: reject undefined/empty preset values
    if (!preset || typeof preset !== "string" || preset.trim() === "") {
      console.error("applyPresetAndRefresh called with invalid preset:", preset);
      return;
    }
    try {
      await window.electronAPI.automation.applyPreset(preset);
      const res = await window.electronAPI.automation.getConfig();
      if (res?.success) setConfig(res.data);
    } catch (err) {
      console.error("Failed to apply preset", err);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Instance Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage multiple automation instances</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              try {
                if (showHint) {
                  localStorage.setItem(HINT_KEY, "1");
                } else {
                  localStorage.removeItem(HINT_KEY);
                }
              } catch (e) {}
              setShowHint((s) => {
                const next = !s;
                // Persist the inverse (we store hidden flag)
                try {
                  if (!next) localStorage.setItem(HINT_KEY, "1");
                  else localStorage.removeItem(HINT_KEY);
                } catch (e) {}
                return next;
              });
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={showHint ? "Hide hint" : "Show hint"}
            title={showHint ? "Hide hint" : "Show hint"}
          >
            <Info className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate("/automation/settings")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hint: allow launching Chrome with selected profile for manual setup (cookies, login, etc.) */}
      {showHint && (
        <div className="mb-6">
          <div className="relative flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                Launch profile in Chrome for manual setup
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You can launch the selected profile as a regular Chrome window to perform manual steps (for example, logging in or
                adding cookies) before starting automation. This is useful when certain configuration or authentication must be
                completed in the browser first.
              </p>
            </div>
            <button
              onClick={() => {
                try {
                  localStorage.setItem(HINT_KEY, "1");
                } catch (e) {}
                setShowHint(false);
              }}
              className="absolute right-2 top-2 p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-800/30"
              aria-label="Dismiss hint"
            >
              <X className="w-4 h-4 text-yellow-700 dark:text-yellow-200" />
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <InstanceToolbar
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        setSelectedProfileId={setSelectedProfileId}
        provider={provider}
        setProvider={setProvider}
        isLaunching={isLaunching}
        instancesCount={instances.length}
        instances={instances}
        onLaunch={handleLaunch}
        onStopAll={handleStopAll}
        applyPresetAndRefresh={applyPresetAndRefresh}
        updateCompact={async (compact: boolean) => {
          if (!config) return;
          await window.electronAPI.automation.updateConfig({ grid: { ...config.grid, compact } });
          await window.electronAPI.automation.repositionAll();
          const res = await window.electronAPI.automation.getConfig();
          if (res?.success) setConfig(res.data);
        }}
        config={config}
      />

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
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}>
            {Array.from({ length: gridColumns * gridRows }).map((_, slotIndex) => {
              const inst = slotMap[slotIndex];
              return (
                <div
                  key={`slot-${slotIndex}`}
                  className={`p-4 rounded-xl min-h-[120px] flex flex-col justify-between transition-all duration-200 ${
                    inst
                      ? "bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 ring-1 ring-transparent hover:ring-primary-200/30"
                      : "bg-transparent border border-dashed border-gray-300 dark:border-gray-600"
                  }`}
                  draggable={!!inst}
                  onDragStart={(e) => {
                    if (!inst) return;
                    e.dataTransfer?.setData("text/instance-id", inst.instanceId);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer?.getData("text/instance-id");
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
                    <InstanceCard
                      inst={inst}
                      profileName={getProfileName(inst.profileId)}
                      onOpenChat={() => handleNavigateToDetail(inst.instanceId, "chat")}
                      onStop={() => handleStopInstance(inst.instanceId)}
                    />
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
