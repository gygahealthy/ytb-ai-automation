import { FileJson, X } from "lucide-react";
import { useCallback, useState } from "react";

interface AddJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (jsonString: string) => boolean;
}

export default function AddJsonModal({ isOpen, onClose, onAdd }: AddJsonModalProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const reset = useCallback(() => {
    setJsonInput("");
    setError("");
    setFileName(null);
    setIsDragging(false);
  }, []);


  // parsing handled directly in handleAdd
  // previewError intentionally removed: we validate on Add and show inline errors

  const handleAdd = () => {
    setError("");
    if (!jsonInput.trim()) {
      setError("Please enter JSON content or load a file");
      return;
    }
    // Try parsing and accept several common shapes. If the top-level is an object
    // with a prompts/items/data array, extract that array and pass it along.
    let payloadToSend = jsonInput;
    try {
      const parsed = JSON.parse(jsonInput);
      let arr: any[] | null = null;
      if (Array.isArray(parsed)) {
        arr = parsed;
      } else if (parsed && typeof parsed === "object") {
        if (Array.isArray((parsed as any).prompts)) {
          arr = (parsed as any).prompts;
        } else if (Array.isArray((parsed as any).items)) {
          arr = (parsed as any).items;
        } else if (Array.isArray((parsed as any).data)) {
          arr = (parsed as any).data;
        } else {
          setError("JSON root object must contain an array under 'prompts', 'items', or 'data'");
          return;
        }
      } else {
        setError("JSON must be an array of strings or objects");
        return;
      }

      // Convert every item to string: keep strings, stringify objects
      if (!arr) {
        setError("No array found in JSON");
        return;
      }
      const arrayOfStrings = arr.map((item: any) => (typeof item === "string" ? item : JSON.stringify(item)));
      payloadToSend = JSON.stringify(arrayOfStrings, null, 2);
    } catch (err) {
      setError("Invalid JSON: " + (err as Error).message);
      return;
    }

    const success = onAdd(payloadToSend);
    if (success) {
      reset();
      onClose();
    } else {
      setError("Failed to load JSON into prompts. Check format and try again.");
    }
  };

  // simple preview error (used in UI)

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      setJsonInput(text);
      setError("");
    } catch (err) {
      setError("Failed to read file: " + (err as Error).message);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) await handleFile(file);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleClose}>
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileJson className="w-6 h-6 text-primary-500" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Prompts from JSON</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Import prompts from JSON array</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">JSON Input</label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`w-full mb-3 p-4 border-2 rounded-lg transition-all ${
                    isDragging ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" : "border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="application/json,.json"
                        id="jsonFileInput"
                        onChange={async (e) => {
                          setError("");
                          const file = e.target.files && e.target.files[0];
                          await handleFile(file ?? null);
                        }}
                        className="hidden"
                      />
                      <label htmlFor="jsonFileInput" className="px-3 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 cursor-pointer text-sm">
                        Choose File
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (!jsonInput.trim()) {
                            setError("No JSON loaded from file or input");
                            return;
                          }
                          handleAdd();
                        }}
                        className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm"
                      >
                        Add to List
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">{fileName ?? "No file chosen"}</div>
                  </div>

                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`Enter prompts as JSON array:\n[\n  "First prompt here",\n  "Second prompt here",\n  "Third prompt here"\n]\n\nOr as objects:\n[\n  { "text": "First prompt", "order": 0 },\n  { "text": "Second prompt", "order": 1 }\n]`}
                    rows={14}
                    className="w-full px-4 py-3 border border-transparent rounded-md bg-transparent text-gray-900 dark:text-white focus:outline-none font-mono text-sm resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Tip:</strong> New prompts will be added to the top of your current list.
                  </p>
                </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
            >
              Add to List
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
