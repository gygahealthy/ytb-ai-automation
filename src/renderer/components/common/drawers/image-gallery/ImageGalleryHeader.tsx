interface ImageGalleryHeaderProps {
  gridColumns: 2 | 3 | 4 | 5;
  onGridColumnsChange: (cols: 2 | 3 | 4 | 5) => void;
}

/**
 * Image Gallery Header - Grid column selector
 */
export default function ImageGalleryHeader({ gridColumns, onGridColumnsChange }: ImageGalleryHeaderProps) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <span className="text-xs text-gray-500 dark:text-gray-400">Grid:</span>
      <div className="flex gap-1">
        {([2, 3, 4, 5] as const).map((cols) => (
          <button
            key={cols}
            onClick={() => onGridColumnsChange(cols)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              gridColumns === cols
                ? "bg-purple-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {cols}×1
          </button>
        ))}
      </div>
    </div>
  );
}
