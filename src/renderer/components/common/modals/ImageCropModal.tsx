import { useState, useEffect, useRef } from "react";
import { CropArea, AspectRatio, calculateInitialCropArea, getAspectRatioValue } from "../../../utils/imageCrop";

interface ImageCropModalContentProps {
  imagePath: string; // Blob URL for preview display
  tempFilePath: string; // Actual file path in temp folder for processing
  onCrop: (cropArea: CropArea, aspectRatio: AspectRatio) => void;
}

export default function ImageCropModalContent({ imagePath, tempFilePath, onCrop }: ImageCropModalContentProps) {
  console.log("[ImageCropModal] Initialized with:", { imagePath, tempFilePath });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("landscape");
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [imageDisplaySize, setImageDisplaySize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image and calculate initial crop area
  useEffect(() => {
    if (imagePath && imageRef.current) {
      const img = imageRef.current;
      const onLoad = () => {
        const { naturalWidth, naturalHeight, width, height } = img;
        console.log("[ImageCropModal] Image loaded:", {
          naturalWidth,
          naturalHeight,
          displayWidth: width,
          displayHeight: height,
        });
        setImageNaturalSize({ width: naturalWidth, height: naturalHeight });
        setImageDisplaySize({ width, height });
        const initialCrop = calculateInitialCropArea(width, height, aspectRatio);
        setCropArea(initialCrop);
        setImageLoaded(true);
      };

      if (img.complete && img.naturalWidth > 0) {
        onLoad();
      } else {
        img.addEventListener("load", onLoad);
        return () => img.removeEventListener("load", onLoad);
      }
    }
  }, [imagePath, aspectRatio]);

  // Update display size on window resize
  useEffect(() => {
    const updateDisplaySize = () => {
      if (imageRef.current && imageLoaded) {
        const { width, height } = imageRef.current;
        setImageDisplaySize({ width, height });
        // Recalculate crop area based on new display size
        const initialCrop = calculateInitialCropArea(width, height, aspectRatio);
        setCropArea(initialCrop);
      }
    };

    window.addEventListener("resize", updateDisplaySize);
    return () => window.removeEventListener("resize", updateDisplaySize);
  }, [imageLoaded, aspectRatio]);

  // Reset crop area when aspect ratio changes
  const handleAspectRatioChange = (newRatio: AspectRatio) => {
    setAspectRatio(newRatio);
    if (imageDisplaySize.width > 0 && imageDisplaySize.height > 0) {
      const newCrop = calculateInitialCropArea(imageDisplaySize.width, imageDisplaySize.height, newRatio);
      setCropArea(newCrop);
    }
  };

  // Handle mouse down on crop area (start dragging)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      const rect = imageRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
      }
      e.preventDefault();
    }
  };

  // Handle mouse down on resize handles
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    setIsResizing(true);
    setResizeHandle(handle);
    const rect = imageRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle mouse move (dragging or resizing)
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging && dragStart) {
      const newX = Math.max(0, Math.min(mouseX - dragStart.x, imageDisplaySize.width - cropArea.width));
      const newY = Math.max(0, Math.min(mouseY - dragStart.y, imageDisplaySize.height - cropArea.height));
      setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing && dragStart && resizeHandle) {
      const deltaX = mouseX - dragStart.x;
      const ratio = getAspectRatioValue(aspectRatio);

      let newCrop = { ...cropArea };

      // Calculate new dimensions based on resize handle
      switch (resizeHandle) {
        case "nw": // Top-left
          {
            const newWidth = Math.max(50, cropArea.width - deltaX);
            const newHeight = newWidth / ratio;
            const newX = cropArea.x + cropArea.width - newWidth;
            const newY = cropArea.y + cropArea.height - newHeight;
            if (newX >= 0 && newY >= 0) {
              newCrop = { x: newX, y: newY, width: newWidth, height: newHeight };
            }
          }
          break;
        case "ne": // Top-right
          {
            const newWidth = Math.max(50, cropArea.width + deltaX);
            const newHeight = newWidth / ratio;
            const newY = cropArea.y + cropArea.height - newHeight;
            if (cropArea.x + newWidth <= imageDisplaySize.width && newY >= 0) {
              newCrop = { ...cropArea, y: newY, width: newWidth, height: newHeight };
            }
          }
          break;
        case "sw": // Bottom-left
          {
            const newWidth = Math.max(50, cropArea.width - deltaX);
            const newHeight = newWidth / ratio;
            const newX = cropArea.x + cropArea.width - newWidth;
            if (newX >= 0 && cropArea.y + newHeight <= imageDisplaySize.height) {
              newCrop = { ...cropArea, x: newX, width: newWidth, height: newHeight };
            }
          }
          break;
        case "se": // Bottom-right
          {
            const newWidth = Math.max(50, cropArea.width + deltaX);
            const newHeight = newWidth / ratio;
            if (cropArea.x + newWidth <= imageDisplaySize.width && cropArea.y + newHeight <= imageDisplaySize.height) {
              newCrop = { ...cropArea, width: newWidth, height: newHeight };
            }
          }
          break;
      }

      // Validate new crop area
      if (
        newCrop.width >= 50 &&
        newCrop.height >= 50 &&
        newCrop.x >= 0 &&
        newCrop.y >= 0 &&
        newCrop.x + newCrop.width <= imageDisplaySize.width &&
        newCrop.y + newCrop.height <= imageDisplaySize.height
      ) {
        setCropArea(newCrop);
        setDragStart({ x: mouseX, y: mouseY });
      }
    }
  };

  // Handle mouse up (stop dragging/resizing)
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setDragStart(null);
  };

  // Reset to initial crop area
  const handleReset = () => {
    if (imageDisplaySize.width > 0 && imageDisplaySize.height > 0) {
      const initialCrop = calculateInitialCropArea(imageDisplaySize.width, imageDisplaySize.height, aspectRatio);
      setCropArea(initialCrop);
    }
  };

  // Handle crop and save - convert display coordinates to natural image coordinates
  const handleCropAndSave = () => {
    // Calculate scale factor
    const scaleX = imageNaturalSize.width / imageDisplaySize.width;
    const scaleY = imageNaturalSize.height / imageDisplaySize.height;

    // Convert crop area from display coordinates to natural coordinates
    const naturalCropArea: CropArea = {
      x: Math.round(cropArea.x * scaleX),
      y: Math.round(cropArea.y * scaleY),
      width: Math.round(cropArea.width * scaleX),
      height: Math.round(cropArea.height * scaleY),
    };

    console.log("[ImageCropModal] Crop area (display):", cropArea);
    console.log("[ImageCropModal] Crop area (natural):", naturalCropArea);
    console.log("[ImageCropModal] Scale factors:", { scaleX, scaleY });

    onCrop(naturalCropArea, aspectRatio);
  };

  return (
    <div className="w-full flex flex-col bg-gray-900" style={{ height: "calc(100vh - 200px)" }}>
      {/* Image Container */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center overflow-hidden bg-gray-950"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ minHeight: "400px" }}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-400">Loading image...</div>
          </div>
        )}

        <div className="relative inline-block max-w-full max-h-full">
          <img
            ref={imageRef}
            src={imagePath}
            alt="Crop preview"
            className="max-w-full max-h-full object-contain block"
            style={{ maxHeight: "calc(100vh - 350px)" }}
            draggable={false}
            onError={(e) => {
              console.error("[ImageCropModal] Failed to load image:", e);
              console.error("[ImageCropModal] Image path:", imagePath);
            }}
          />

          {/* Crop Overlay - Only show when image is loaded */}
          {imageLoaded && cropArea.width > 0 && imageDisplaySize.width > 0 && (
            <>
              {/* Dark overlay outside crop area */}
              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: `${imageDisplaySize.width}px`,
                  height: `${imageDisplaySize.height}px`,
                  background: "rgba(0, 0, 0, 0.6)",
                  clipPath: `polygon(
                    0% 0%,
                    100% 0%,
                    100% 100%,
                    0% 100%,
                    0% 0%,
                    ${cropArea.x}px ${cropArea.y}px,
                    ${cropArea.x}px ${cropArea.y + cropArea.height}px,
                    ${cropArea.x + cropArea.width}px ${cropArea.y + cropArea.height}px,
                    ${cropArea.x + cropArea.width}px ${cropArea.y}px,
                    ${cropArea.x}px ${cropArea.y}px
                  )`,
                }}
              />

              {/* Crop area border and handles */}
              <div
                className="absolute border-2 border-white shadow-lg cursor-move select-none"
                style={{
                  left: `${cropArea.x}px`,
                  top: `${cropArea.y}px`,
                  width: `${cropArea.width}px`,
                  height: `${cropArea.height}px`,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0)",
                }}
                onMouseDown={handleMouseDown}
              >
                {/* Grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/3 left-0 right-0 border-t border-white/30" />
                  <div className="absolute top-2/3 left-0 right-0 border-t border-white/30" />
                  <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/30" />
                  <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/30" />
                </div>

                {/* Corner resize handles */}
                <div
                  className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:scale-125 transition-transform shadow-lg"
                  style={{ left: "-10px", top: "-10px" }}
                  onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
                />
                <div
                  className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:scale-125 transition-transform shadow-lg"
                  style={{ right: "-10px", top: "-10px" }}
                  onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
                />
                <div
                  className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:scale-125 transition-transform shadow-lg"
                  style={{ left: "-10px", bottom: "-10px" }}
                  onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
                />
                <div
                  className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:scale-125 transition-transform shadow-lg"
                  style={{ right: "-10px", bottom: "-10px" }}
                  onMouseDown={(e) => handleResizeMouseDown(e, "se")}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-t border-gray-800">
        {/* Left: Reset */}
        <button
          onClick={handleReset}
          className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 hover:text-white transition-all"
          disabled={!imageLoaded}
        >
          Reset
        </button>

        {/* Center: Aspect Ratio */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => handleAspectRatioChange("landscape")}
            disabled={!imageLoaded}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              aspectRatio === "landscape"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="7" width="18" height="10" rx="1" />
            </svg>
            Landscape
          </button>
          <button
            onClick={() => handleAspectRatioChange("portrait")}
            disabled={!imageLoaded}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              aspectRatio === "portrait" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="7" y="3" width="10" height="18" rx="1" />
            </svg>
            Portrait
          </button>
        </div>

        {/* Right: Crop and Save */}
        <button
          onClick={handleCropAndSave}
          disabled={!imageLoaded}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 3v6H3m18 12v-6h-6M3 9L9 3m6 18l6-6" />
          </svg>
          Crop and Save
        </button>
      </div>
    </div>
  );
}
