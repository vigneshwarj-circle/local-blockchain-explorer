import React, { useState, useRef, useEffect } from "react";
import { useRPCManager } from "./useRPCManager";
import RPCConfigModal from "./RPCConfigModal";

const RPCSelector: React.FC = () => {
  const {
    configs,
    activeId,
    getActiveConfig,
    addRPCConfig,
    updateRPCConfig,
    setActiveConfig,
    deleteRPCConfig,
  } = useRPCManager();

  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<{
    id: string;
    name: string;
    url: string;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeConfig = getActiveConfig();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSwitch = (id: string) => {
    if (id === activeId) {
      setIsOpen(false);
      return;
    }

    const confirmSwitch = window.confirm(
      "Switching RPC endpoints will reload the page. Any unsaved changes will be lost. Continue?",
    );

    if (confirmSwitch) {
      setActiveConfig(id);
      window.location.reload();
    }
  };

  const handleAdd = (name: string, url: string) => {
    addRPCConfig(name, url);
    setShowAddModal(false);
    window.location.reload();
  };

  const handleEdit = (id: string, name: string, url: string) => {
    updateRPCConfig(id, name, url);
    setShowEditModal(false);
    setEditingConfig(null);
    
    // If editing the active config, reload
    if (id === activeId) {
      window.location.reload();
    }
  };

  const handleDelete = (id: string) => {
    const isActive = id === activeId;
    deleteRPCConfig(id);
    setShowDeleteConfirm(null);
    
    // If we deleted the active config, reload to use the new active one
    if (isActive) {
      window.location.reload();
    }
  };

  const truncateUrl = (url: string, maxLength: number = 30) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + "...";
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          title={activeConfig?.url || "No RPC configured"}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
            />
          </svg>
          <span className="hidden md:inline">
            {activeConfig?.name || "RPC"}
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 p-3 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                RPC Endpoints
              </h3>
              {activeConfig && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Active: {truncateUrl(activeConfig.url)}
                </p>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {configs.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No RPC endpoints configured
                </div>
              ) : (
                <div className="p-2">
                  {configs.map((config) => (
                    <div
                      key={config.id}
                      className={`mb-1 rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        config.id === activeId ? "bg-blue-50 dark:bg-blue-900" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <button
                          onClick={() => handleSwitch(config.id)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            {config.id === activeId && (
                              <svg
                                className="h-4 w-4 text-green-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {config.name}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {truncateUrl(config.url, 50)}
                          </p>
                        </button>

                        <div className="ml-2 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingConfig({
                                id: config.id,
                                name: config.name,
                                url: config.url,
                              });
                              setShowEditModal(true);
                              setIsOpen(false);
                            }}
                            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                            title="Edit"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(config.id);
                            }}
                            className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-2 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowAddModal(true);
                  setIsOpen(false);
                }}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + Add New RPC
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <RPCConfigModal
          onSave={handleAdd}
          onCancel={() => setShowAddModal(false)}
          showCancel={true}
        />
      )}

      {showEditModal && editingConfig && (
        <RPCConfigModal
          onSave={(name, url) => handleEdit(editingConfig.id, name, url)}
          onCancel={() => {
            setShowEditModal(false);
            setEditingConfig(null);
          }}
          initialName={editingConfig.name}
          initialUrl={editingConfig.url}
          isEdit={true}
          showCancel={true}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Delete RPC Endpoint
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this RPC endpoint? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RPCSelector;

