// JSX runtime does not require explicit React import
interface ConfirmModalProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ title = 'Confirm', message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel} />
      <div className="bg-white dark:bg-gray-800 rounded shadow-lg max-w-md w-full p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">{message}</p>
          </div>
          <button className="text-gray-500" onClick={onCancel}>✕</button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-700" onClick={onCancel}>Cancel</button>
          <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
