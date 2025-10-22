/// <reference types="../../types/electron-api" />
import { Plus, Edit2, Trash2, Search, Tag } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAlert } from "../../hooks/useAlert";
import { useConfirm } from "../../hooks/useConfirm";
import electronApi from "../../ipc";

interface PromptType {
  id: number;
  typeName: string;
  description: string;
  typeCode: string;
  status: number;
  createdAt: string;
}

interface PromptTypeFormData {
  typeName: string;
  description: string;
  typeCode: string;
  status: number;
}

const PromptTypesPage: React.FC = () => {
  const alertApi = useAlert();
  const confirm = useConfirm();

  const [promptTypes, setPromptTypes] = useState<PromptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<PromptType | null>(null);
  const [formData, setFormData] = useState<PromptTypeFormData>({
    typeName: "",
    description: "",
    typeCode: "",
    status: 1,
  });

  useEffect(() => {
    loadPromptTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPromptTypes = async () => {
    setLoading(true);
    try {
      const result = await electronApi.promptTypes.getAll();
      if (result.success && result.data) {
        setPromptTypes(result.data);
      } else {
        alertApi.show({
          message: "Failed to load prompt types",
          title: "Error",
        });
      }
    } catch (error) {
      console.error("Failed to load prompt types:", error);
      alertApi.show({
        message: "Failed to load prompt types",
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type?: PromptType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        typeName: type.typeName,
        description: type.description,
        typeCode: type.typeCode,
        status: type.status,
      });
    } else {
      setEditingType(null);
      setFormData({
        typeName: "",
        description: "",
        typeCode: "",
        status: 1,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingType(null);
    setFormData({
      typeName: "",
      description: "",
      typeCode: "",
      status: 1,
    });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.typeName.trim()) {
      alertApi.show({
        message: "Type name is required",
        title: "Validation Error",
      });
      return;
    }

    if (!formData.typeCode.trim()) {
      alertApi.show({
        message: "Type code is required",
        title: "Validation Error",
      });
      return;
    }

    try {
      let result;
      if (editingType) {
        // Update
        result = await electronApi.promptTypes.update(editingType.id, {
          typeName: formData.typeName.trim(),
          description: formData.description.trim(),
          typeCode: formData.typeCode.trim(),
          status: formData.status,
        });
      } else {
        // Create
        result = await electronApi.promptTypes.create({
          typeName: formData.typeName.trim(),
          description: formData.description.trim(),
          typeCode: formData.typeCode.trim(),
          status: formData.status,
        });
      }

      if (result.success) {
        alertApi.show({
          message: editingType
            ? "Prompt type updated successfully"
            : "Prompt type created successfully",
          title: "Success",
        });
        handleCloseModal();
        await loadPromptTypes();
      } else {
        alertApi.show({
          message: result.error || "Failed to save prompt type",
          title: "Error",
        });
      }
    } catch (error) {
      console.error("Failed to save prompt type:", error);
      alertApi.show({
        message: "Failed to save prompt type",
        title: "Error",
      });
    }
  };

  const handleDelete = async (type: PromptType) => {
    if (
      !(await confirm({
        message: `Delete prompt type "${type.typeName}"? This action cannot be undone.`,
      }))
    ) {
      return;
    }

    try {
      const result = await electronApi.promptTypes.deleteType(type.id);
      if (result.success) {
        alertApi.show({
          message: "Prompt type deleted successfully",
          title: "Success",
        });
        await loadPromptTypes();
      } else {
        alertApi.show({
          message: result.error || "Failed to delete prompt type",
          title: "Error",
        });
      }
    } catch (error) {
      console.error("Failed to delete prompt type:", error);
      alertApi.show({
        message: "Failed to delete prompt type",
        title: "Error",
      });
    }
  };

  const filteredTypes = promptTypes.filter(
    (type) =>
      type.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-white">
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                <Tag className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Prompt Types Management</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Create and manage prompt types for your prompts
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wide">
                Total Types
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {promptTypes.length}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search prompt types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Type
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                Loading prompt types...
              </p>
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-block p-3 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                <Tag className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchTerm
                  ? "No prompt types match your search"
                  : "No prompt types yet"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => handleOpenModal()}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  Create the first one
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                      Type Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                      Type Code
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-slate-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTypes.map((type, index) => (
                    <tr
                      key={type.id}
                      className={`border-b border-slate-200 dark:border-slate-700 transition-colors ${
                        index % 2 === 0
                          ? "bg-white dark:bg-slate-800"
                          : "bg-slate-50 dark:bg-slate-700/30"
                      } hover:bg-indigo-50 dark:hover:bg-slate-700`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                          {type.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {type.typeName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {type.typeCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs truncate">
                          {type.description || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            type.status === 1
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {type.status === 1 ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(type.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(type)}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(type)}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={handleCloseModal} />

          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingType ? "Edit Prompt Type" : "Create New Prompt Type"}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {editingType
                  ? "Update the prompt type details below"
                  : "Add a new prompt type for your prompts"}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Type Name *
                </label>
                <input
                  type="text"
                  value={formData.typeName}
                  onChange={(e) =>
                    setFormData({ ...formData, typeName: e.target.value })
                  }
                  placeholder="e.g., video_analysis, topic_generation"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Type Code *
                </label>
                <input
                  type="text"
                  value={formData.typeCode}
                  onChange={(e) =>
                    setFormData({ ...formData, typeCode: e.target.value })
                  }
                  placeholder="e.g., VA, TG, VP"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter a brief description..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-500 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                {editingType ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptTypesPage;
