import { useCallback, useState, useEffect } from "react";
import { RPCConfig, RPCStorage, ConnectionTestResult } from "./types";
import { JsonRpcProvider, WebSocketProvider } from "ethers";

const STORAGE_KEY = "otterscan_rpc_configs";

/**
 * Get the RPC storage from localStorage
 */
const getStorage = (): RPCStorage => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { configs: [], activeId: null };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error reading RPC configs from localStorage:", error);
    return { configs: [], activeId: null };
  }
};

/**
 * Save the RPC storage to localStorage
 */
const saveStorage = (storage: RPCStorage): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error("Error saving RPC configs to localStorage:", error);
  }
};

/**
 * Generate a simple UUID v4
 */
const generateId = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Test connection to an RPC endpoint
 */
export const testRPCConnection = async (
  url: string,
): Promise<ConnectionTestResult> => {
  try {
    let provider;
    if (url.startsWith("ws://") || url.startsWith("wss://")) {
      provider = new WebSocketProvider(url, undefined, {
        staticNetwork: true,
      });
    } else {
      provider = new JsonRpcProvider(url, undefined, {
        staticNetwork: true,
      });
    }

    // Test basic connection by getting chain ID
    const network = await provider.getNetwork();
    
    // Clean up websocket if used
    if (provider instanceof WebSocketProvider) {
      provider.destroy();
    }

    return {
      success: true,
      chainId: network.chainId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to connect to RPC endpoint",
    };
  }
};

/**
 * Hook for managing RPC configurations
 */
export const useRPCManager = () => {
  const [configs, setConfigs] = useState<RPCConfig[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);

  // Load configs from localStorage on mount
  useEffect(() => {
    const storage = getStorage();
    setConfigs(storage.configs);
    setActiveIdState(storage.activeId);
  }, []);

  /**
   * Check if any RPC config exists
   */
  const hasAnyConfig = useCallback((): boolean => {
    const storage = getStorage();
    return storage.configs.length > 0;
  }, []);

  /**
   * Get all RPC configurations
   */
  const getRPCConfigs = useCallback((): RPCConfig[] => {
    return configs;
  }, [configs]);

  /**
   * Get the currently active RPC config
   */
  const getActiveConfig = useCallback((): RPCConfig | null => {
    if (!activeId) return null;
    return configs.find((c) => c.id === activeId) || null;
  }, [configs, activeId]);

  /**
   * Add a new RPC configuration
   */
  const addRPCConfig = useCallback(
    (name: string, url: string): RPCConfig => {
      const newConfig: RPCConfig = {
        id: generateId(),
        name,
        url,
        createdAt: Date.now(),
      };

      const storage = getStorage();
      storage.configs.push(newConfig);
      
      // If this is the first config, make it active
      if (storage.configs.length === 1) {
        storage.activeId = newConfig.id;
      }
      
      saveStorage(storage);
      setConfigs(storage.configs);
      setActiveIdState(storage.activeId);

      return newConfig;
    },
    [],
  );

  /**
   * Update an existing RPC configuration
   */
  const updateRPCConfig = useCallback(
    (id: string, name: string, url: string): boolean => {
      const storage = getStorage();
      const index = storage.configs.findIndex((c) => c.id === id);
      
      if (index === -1) return false;
      
      storage.configs[index] = {
        ...storage.configs[index],
        name,
        url,
      };
      
      saveStorage(storage);
      setConfigs(storage.configs);
      
      return true;
    },
    [],
  );

  /**
   * Set the active RPC configuration
   */
  const setActiveConfig = useCallback((id: string): boolean => {
    const storage = getStorage();
    const config = storage.configs.find((c) => c.id === id);
    
    if (!config) return false;
    
    storage.activeId = id;
    saveStorage(storage);
    setActiveIdState(id);
    
    return true;
  }, []);

  /**
   * Delete an RPC configuration
   */
  const deleteRPCConfig = useCallback((id: string): boolean => {
    const storage = getStorage();
    const index = storage.configs.findIndex((c) => c.id === id);
    
    if (index === -1) return false;
    
    storage.configs.splice(index, 1);
    
    // If we deleted the active config, set a new one
    if (storage.activeId === id) {
      storage.activeId = storage.configs.length > 0 ? storage.configs[0].id : null;
    }
    
    saveStorage(storage);
    setConfigs(storage.configs);
    setActiveIdState(storage.activeId);
    
    return true;
  }, []);

  return {
    configs,
    activeId,
    hasAnyConfig,
    getRPCConfigs,
    getActiveConfig,
    addRPCConfig,
    updateRPCConfig,
    setActiveConfig,
    deleteRPCConfig,
  };
};

/**
 * Standalone function to check if any config exists (for use outside React)
 */
export const hasAnyRPCConfig = (): boolean => {
  const storage = getStorage();
  return storage.configs.length > 0;
};

/**
 * Standalone function to get active config (for use outside React)
 */
export const getActiveRPCConfig = (): RPCConfig | null => {
  const storage = getStorage();
  if (!storage.activeId) return null;
  return storage.configs.find((c) => c.id === storage.activeId) || null;
};

