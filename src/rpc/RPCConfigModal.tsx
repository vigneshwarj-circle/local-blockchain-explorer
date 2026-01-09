import React, { useState, FormEvent } from "react";
import { testRPCConnection } from "./useRPCManager";

interface RPCConfigModalProps {
  onSave: (name: string, url: string) => void;
  onCancel?: () => void;
  initialName?: string;
  initialUrl?: string;
  isEdit?: boolean;
  showCancel?: boolean;
}

const RPCConfigModal: React.FC<RPCConfigModalProps> = ({
  onSave,
  onCancel,
  initialName = "",
  initialUrl = "",
  isEdit = false,
  showCancel = false,
}) => {
  const [name, setName] = useState(initialName);
  const [url, setUrl] = useState(initialUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string>("");

  const validateUrl = (urlString: string): boolean => {
    try {
      const parsedUrl = new URL(urlString);
      return (
        parsedUrl.protocol === "http:" ||
        parsedUrl.protocol === "https:" ||
        parsedUrl.protocol === "ws:" ||
        parsedUrl.protocol === "wss:"
      );
    } catch {
      return false;
    }
  };

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestResult({ success: false, message: "Please enter a URL" });
      return;
    }

    if (!validateUrl(url)) {
      setTestResult({
        success: false,
        message: "Invalid URL format. Must start with http://, https://, ws://, or wss://",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testRPCConnection(url);

    if (result.success) {
      setTestResult({
        success: true,
        message: `Connected successfully! Chain ID: ${result.chainId?.toString()}`,
      });
      setError("");
    } else {
      setTestResult({
        success: false,
        message: result.error || "Connection failed",
      });
    }

    setIsTesting(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("RPC URL is required");
      return;
    }

    if (!validateUrl(url)) {
      setError("Invalid URL format");
      return;
    }

    const finalName = name.trim() || url;

    // Test connection before saving
    setIsTesting(true);
    const result = await testRPCConnection(url);
    setIsTesting(false);

    if (!result.success) {
      setError(result.error || "Failed to connect to RPC endpoint");
      setTestResult({
        success: false,
        message: result.error || "Connection failed",
      });
      return;
    }

    onSave(finalName, url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? "Edit RPC Endpoint" : "Configure RPC Endpoint"}
        </h2>
        
        {!isEdit && (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            To get started, please configure your Ethereum RPC endpoint. This can be a local node or a remote provider.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="rpc-name"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Name (Optional)
            </label>
            <input
              id="rpc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Local Node, Mainnet Fork"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="rpc-url"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              RPC URL <span className="text-red-500">*</span>
            </label>
            <input
              id="rpc-url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTestResult(null);
                setError("");
              }}
              placeholder="http://localhost:8545"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {testResult && (
            <div
              className={`rounded-md p-3 text-sm ${
                testResult.success
                  ? "bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {testResult.message}
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !url.trim()}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              {isTesting ? "Testing..." : "Test Connection"}
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            {showCancel && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isTesting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isTesting ? "Connecting..." : isEdit ? "Update" : "Save & Connect"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RPCConfigModal;

