/**
 * Represents a single RPC endpoint configuration
 */
export interface RPCConfig {
  /** Unique identifier for this RPC config */
  id: string;
  /** User-friendly name for this RPC endpoint */
  name: string;
  /** The RPC endpoint URL */
  url: string;
  /** Timestamp when this config was created */
  createdAt: number;
}

/**
 * Structure stored in localStorage for RPC management
 */
export interface RPCStorage {
  /** Array of saved RPC configurations */
  configs: RPCConfig[];
  /** ID of the currently active RPC config */
  activeId: string | null;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  success: boolean;
  chainId?: bigint;
  error?: string;
}

