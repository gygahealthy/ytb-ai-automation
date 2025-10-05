interface Props {
  logLines: string[];
  onClear?: () => void;
}

export default function IPCLog({ logLines, onClear }: Props) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="font-semibold mb-2">IPC Log</h3>
      <div className="text-sm font-mono text-gray-600 dark:text-gray-300 mb-3">
        {logLines.map((l, idx) => (
          <div key={idx} className="mb-1">{l}</div>
        ))}
      </div>
      <div className="mt-auto">
        <button onClick={() => onClear && onClear()} className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100">
          Clear
        </button>
      </div>
    </div>
  );
}
