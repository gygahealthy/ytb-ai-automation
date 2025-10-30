import { create } from 'zustand';

/**
 * Secret storage structure for a profile
 */
interface ProfileSecrets {
  flowNextKey?: string;
  bearerToken?: string;
  apiKey?: string;
  authToken?: string;
  lastUpdated: string;
}

/**
 * Zustand store state for secret management
 */
interface SecretState {
  secrets: Map<string, ProfileSecrets>;
  loading: boolean;
  error: string | null;

  // Actions
  setSecret: (profileId: string, type: 'flowNextKey' | 'bearerToken' | 'apiKey' | 'authToken', value: string) => void;
  getSecret: (profileId: string, type: 'flowNextKey' | 'bearerToken' | 'apiKey' | 'authToken') => string | undefined;
  clearSecret: (profileId: string) => void;
  clearAllSecrets: () => void;
  hydrateFromDatabase: () => Promise<void>;
  extractSecrets: (profileId: string) => Promise<boolean>;
  refreshSecrets: (profileId: string) => Promise<boolean>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Zustand store for managing profile secrets in the renderer
 */
export const useSecretStore = create<SecretState>((set, get) => ({
  secrets: new Map(),
  loading: false,
  error: null,

  /**
   * Set a specific secret for a profile
   */
  setSecret: (profileId, type, value) => {
    set((state) => {
      const newSecrets = new Map(state.secrets);
      const existing = newSecrets.get(profileId) || { lastUpdated: new Date().toISOString() };
      
      newSecrets.set(profileId, {
        ...existing,
        [type]: value,
        lastUpdated: new Date().toISOString(),
      });
      
      return { secrets: newSecrets, error: null };
    });
  },

  /**
   * Get a specific secret for a profile
   */
  getSecret: (profileId, type) => {
    return get().secrets.get(profileId)?.[type];
  },

  /**
   * Clear all secrets for a profile
   */
  clearSecret: (profileId) => {
    set((state) => {
      const newSecrets = new Map(state.secrets);
      newSecrets.delete(profileId);
      return { secrets: newSecrets };
    });
  },

  /**
   * Clear all secrets
   */
  clearAllSecrets: () => {
    set({ secrets: new Map(), error: null });
  },

  /**
   * Hydrate secrets from database on app start
   */
  hydrateFromDatabase: async () => {
    set({ loading: true, error: null });
    
    try {
      const result = await (window as any).electronAPI.invoke('secret-extraction:get-all', {});
      
      if (result.success && result.secrets) {
        const newSecrets = new Map<string, ProfileSecrets>();
        
        for (const secret of result.secrets) {
          const existing = newSecrets.get(secret.profileId) || { lastUpdated: secret.extractedAt };
          
          const key = (() => {
            switch (secret.secretType) {
              case 'FLOW_NEXT_KEY': return 'flowNextKey';
              case 'BEARER_TOKEN': return 'bearerToken';
              case 'API_KEY': return 'apiKey';
              case 'AUTH_TOKEN': return 'authToken';
              default: return null;
            }
          })();
          
          if (key) {
            newSecrets.set(secret.profileId, {
              ...existing,
              [key]: secret.secretValue,
              lastUpdated: secret.extractedAt,
            });
          }
        }
        
        set({ secrets: newSecrets, loading: false, error: null });
        console.log(`[SecretStore] Hydrated ${newSecrets.size} profile secrets from database`);
      } else {
        set({ loading: false, error: result.error || 'Failed to hydrate secrets' });
      }
    } catch (error) {
      console.error('[SecretStore] Failed to hydrate secrets from database:', error);
      set({ loading: false, error: error instanceof Error ? error.message : String(error) });
    }
  },

  /**
   * Extract secrets for a profile
   */
  extractSecrets: async (profileId: string) => {
    set({ loading: true, error: null });
    
    try {
      const result = await (window as any).electronAPI.invoke('secret-extraction:extract', { profileId });
      
      if (result.success && result.data.success) {
        // Refresh from database to get the newly stored secrets
        await get().hydrateFromDatabase();
        return true;
      } else {
        set({ loading: false, error: result.data?.error || result.error || 'Extraction failed' });
        return false;
      }
    } catch (error) {
      console.error('[SecretStore] Failed to extract secrets:', error);
      set({ loading: false, error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  },

  /**
   * Refresh secrets for a profile (invalidate old and extract new)
   */
  refreshSecrets: async (profileId: string) => {
    set({ loading: true, error: null });
    
    try {
      const result = await (window as any).electronAPI.invoke('secret-extraction:refresh', { profileId });
      
      if (result.success && result.data.success) {
        // Refresh from database
        await get().hydrateFromDatabase();
        return true;
      } else {
        set({ loading: false, error: result.data?.error || result.error || 'Refresh failed' });
        return false;
      }
    } catch (error) {
      console.error('[SecretStore] Failed to refresh secrets:', error);
      set({ loading: false, error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  },

  /**
   * Set loading state
   */
  setLoading: (loading) => {
    set({ loading });
  },

  /**
   * Set error state
   */
  setError: (error) => {
    set({ error });
  },
}));

/**
 * Hook to check if a profile has a valid FLOW_NEXT_KEY
 */
export function useHasFlowNextKey(profileId: string): boolean {
  const flowNextKey = useSecretStore((state) => state.getSecret(profileId, 'flowNextKey'));
  return !!flowNextKey;
}

/**
 * Hook to get FLOW_NEXT_KEY for a profile
 */
export function useFlowNextKey(profileId: string): string | undefined {
  return useSecretStore((state) => state.getSecret(profileId, 'flowNextKey'));
}
