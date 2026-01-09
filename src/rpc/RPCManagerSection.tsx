import React, { useState } from "react";
import { useRPCManager } from "./useRPCManager";
import RPCConfigModal from "./RPCConfigModal";

const RPCManagerSection: React.FC = () => {
  const {
    configs,
    activeId,
    getActiveConfig,
    addRPCConfig,
    updateRPCConfig,
    setActiveConfig,
    deleteRPCConfig,
  } = useRPCManager();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<{
    id: string;
    name: string;
    url: string;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const activeConfig = getActiveConfig();

  const handleSwitch = (id: string) => {
    if (id === activeId) return;

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <>
      <div className="mb-8 w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            RPC Endpoints
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + Add New
          </button>
        </div>

        {activeConfig && (
          <div className="mb-4 rounded-md bg-green-50 p-4 dark:bg-green-900">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {activeConfig.name}
                  </h3>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-100">
                    Active
                  </span>
                </div>
                <p className="mt-1 font-mono text-sm text-gray-600 dark:text-gray-300">
                  {activeConfig.url}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Added: {formatDate(activeConfig.createdAt)}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingConfig({
                    id: activeConfig.id,
                    name: activeConfig.name,
                    url: activeConfig.url,
                  });
                  setShowEditModal(true);
                }}
                className="ml-4 rounded p-2 text-gray-500 hover:bg-green-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-green-800 dark:hover:text-gray-200"
                title="Edit"
              >
                <svg
                  className="h-5 w-5"
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
            </div>
          </div>
        )}

        {configs.filter((c) => c.id !== activeId).length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Other Endpoints
            </h3>
            <div className="space-y-2">
              {configs
                .filter((c) => c.id !== activeId)
                .map((config) => (
                  <div
                    key={config.id}
                    className="rounded-md border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {config.name}
                        </h4>
                        <p className="mt-1 font-mono text-sm text-gray-600 dark:text-gray-300">
                          {config.url}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Added: {formatDate(config.createdAt)}
                        </p>
                      </div>
                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={() => handleSwitch(config.id)}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                          title="Switch to this endpoint"
                        >
                          Switch
                        </button>
                        <button
                          onClick={() => {
                            setEditingConfig({
                              id: config.id,
                              name: config.name,
                              url: config.url,
                            });
                            setShowEditModal(true);
                          }}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                          title="Edit"
                        >
                          <svg
                            className="h-5 w-5"
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
                          onClick={() => setShowDeleteConfirm(config.id)}
                          className="rounded p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-700 dark:text-gray-400 dark:hover:bg-red-900 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <svg
                            className="h-5 w-5"
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
          </div>
        )}

        {configs.length === 0 && (
          <div className="py-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No RPC endpoints
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first RPC endpoint.
            </p>
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
              Are you sure you want to delete this RPC endpoint? This action
              cannot be undone.
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

export default RPCManagerSection;

