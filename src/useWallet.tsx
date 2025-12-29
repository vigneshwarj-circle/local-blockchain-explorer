import { BrowserProvider, Eip1193Provider } from "ethers";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type WalletState = {
  provider: BrowserProvider | null;
  account: string | null;
  chainId: bigint | null;
  isConnecting: boolean;
  error: string | null;
};

export type WalletContextType = WalletState & {
  connect: (targetChainId?: bigint) => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextType>({
  provider: null,
  account: null,
  chainId: null,
  isConnecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);

type WalletProviderProps = {
  children: React.ReactNode;
};

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (targetChainId?: bigint) => {
    if (typeof globalThis.window === "undefined" || !globalThis.window.ethereum) {
      setError(
        "MetaMask is not installed. Please install MetaMask to use this feature.",
      );
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ethereumProvider = globalThis.window.ethereum as any;

      console.log("Target Chain ID:", targetChainId);

      // Step 1: Switch to the correct chain BEFORE connecting
      if (targetChainId) {
        const chainIdHex = `0x${targetChainId.toString(16)}`;
        console.log(`Step 1: Switching to chain ID ${targetChainId} (${chainIdHex})`);

        try {
          // Use ethereum.request() - the EIP-1193 standard method
          await ethereumProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdHex }],
          });
          console.log("Chain switch successful!");
        } catch (switchError: any) {
          console.error("Switch error:", switchError);

          // Error code 4902 means chain not added to MetaMask
          if (switchError.code === 4902) {
            setError(
              `Chain ID ${targetChainId} is not in your wallet. Please add this network to MetaMask.`,
            );
            throw switchError;
          }

          // Error code 4001 means user rejected
          if (switchError.code === 4001) {
            setError("You rejected the network switch. Please switch manually in MetaMask.");
            throw switchError;
          }

          // Other errors
          console.error("Unknown switch error:", switchError);
          throw switchError;
        }
      }

      // Step 2: Now request accounts (after chain is switched)
      console.log("Step 2: Requesting accounts...");
      const accounts = await ethereumProvider.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }
      console.log("Connected account:", accounts[0]);

      // Step 3: Create provider and verify chain
      const browserProvider = new BrowserProvider(ethereumProvider);
      const network = await browserProvider.getNetwork();
      console.log("Final chain ID:", network.chainId);

      // Verify we're on the right chain
      if (targetChainId && network.chainId !== targetChainId) {
        setError(
          `Chain mismatch: Wallet is on ${network.chainId}, expected ${targetChainId}`,
        );
      }

      setProvider(browserProvider);
      setAccount(accounts[0]);
      setChainId(network.chainId);
    } catch (err: any) {
      console.error("Failed to connect wallet:", err);
      setError(err.message || "Failed to connect wallet");
      setProvider(null);
      setAccount(null);
      setChainId(null);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setProvider(null);
    setAccount(null);
    setChainId(null);
    setError(null);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!globalThis.window?.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(BigInt(chainIdHex));
    };

    const ethereumProvider = globalThis.window.ethereum as any;
    if (ethereumProvider.on) {
      ethereumProvider.on("accountsChanged", handleAccountsChanged);
      ethereumProvider.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (ethereumProvider.removeListener) {
        ethereumProvider.removeListener("accountsChanged", handleAccountsChanged);
        ethereumProvider.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [disconnect]);

  const contextValue = React.useMemo(
    () => ({
      provider,
      account,
      chainId,
      isConnecting,
      error,
      connect,
      disconnect,
    }),
    [provider, account, chainId, isConnecting, error, connect, disconnect],
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

