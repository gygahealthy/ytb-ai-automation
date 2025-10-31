interface GalleryFooterProps {
  imageCount: number;
  selectedCount: number;
  totalDiskSize: number;
}

/**
 * Gallery Footer - Stats display (image count and disk usage)
 */
export default function GalleryFooter({ imageCount, selectedCount, totalDiskSize }: GalleryFooterProps) {
  const formatDiskSize = (): string => {
    if (totalDiskSize === 0) return "0 MB";

    const mb = totalDiskSize / (1024 * 1024);
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
      <span>
        {imageCount} image{imageCount !== 1 ? "s" : ""}
        {selectedCount > 0 && ` (${selectedCount} selected)`}
      </span>
      <span>{formatDiskSize()} used</span>
    </div>
  );
}
