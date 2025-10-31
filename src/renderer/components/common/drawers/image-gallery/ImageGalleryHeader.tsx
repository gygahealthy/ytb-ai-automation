interface ImageGalleryHeaderProps {
  gridColumns: 2 | 3 | 4 | 5;
  onGridColumnsChange: (cols: 2 | 3 | 4 | 5) => void;
}

/**
 * Image Gallery Header - Grid column selector (compact select box)
 */
export default function ImageGalleryHeader({ gridColumns, onGridColumnsChange }: ImageGalleryHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="grid-selector" className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        Grid:
      </label>
      <select
        id="grid-selector"
        value={gridColumns}
        onChange={(e) => onGridColumnsChange(Number(e.target.value) as 2 | 3 | 4 | 5)}
        className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value={2}>2×1</option>
        <option value={3}>3×1</option>
        <option value={4}>4×1</option>
        <option value={5}>5×1</option>
      </select>
    </div>
  );
}
