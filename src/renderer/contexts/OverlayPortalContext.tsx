import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useLayoutEffect,
  // useMemo,
} from "react";
import { createPortal } from "react-dom";

type Direction = "bottom-right" | "bottom-left" | "top-right" | "top-left";

interface OverlayOptions {
  anchor?: HTMLElement | null;
  direction?: Direction;
  gap?: number;
}

interface OverlayEntry {
  id: string;
  node: React.ReactNode;
  options?: OverlayOptions;
}

interface OverlayContextValue {
  showOverlay: (node: React.ReactNode, options?: OverlayOptions) => string;
  updateOverlay: (
    id: string,
    node: React.ReactNode,
    options?: OverlayOptions
  ) => void;
  hideOverlay: (id: string) => void;
}

const OverlayPortalContext = createContext<OverlayContextValue | null>(null);

export const OverlayPortalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [overlays, setOverlays] = useState<OverlayEntry[]>([]);
  const idRef = useRef(0);

  const showOverlay = useCallback(
    (node: React.ReactNode, options?: OverlayOptions) => {
      const id = `overlay_${++idRef.current}`;
      setOverlays((s) => [...s, { id, node, options }]);
      return id;
    },
    []
  );

  const updateOverlay = useCallback(
    (id: string, node: React.ReactNode, options?: OverlayOptions) => {
      setOverlays((s) =>
        s.map((o) => (o.id === id ? { ...o, node, options } : o))
      );
    },
    []
  );

  const hideOverlay = useCallback((id: string) => {
    setOverlays((s) => s.filter((o) => o.id !== id));
  }, []);

  return (
    <OverlayPortalContext.Provider
      value={{ showOverlay, updateOverlay, hideOverlay }}
    >
      {children}
      {typeof document !== "undefined"
        ? createPortal(
            <div id="overlay-portal-root" aria-hidden={true}>
              {overlays.map((overlay) => (
                <OverlayHost key={overlay.id} entry={overlay} />
              ))}
            </div>,
            document.body
          )
        : null}
    </OverlayPortalContext.Provider>
  );
};

const OverlayHostInner = ({ entry }: { entry: OverlayEntry }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>(() => ({
    position: "fixed",
    top: 8,
    right: 8,
    zIndex: 9999,
  }));

  useLayoutEffect(() => {
    const { options } = entry;
    const anchor = options?.anchor;
    const gap = options?.gap ?? 8;
    const direction = options?.direction ?? "bottom-right";

    if (!anchor) {
      setStyle({ position: "fixed", top: gap, right: gap, zIndex: 9999 });
      return;
    }

    // Read layout inside a layout effect to avoid reflow loops during render
    const computePosition = () => {
      try {
        const rect = anchor.getBoundingClientRect();
        const base: React.CSSProperties = { position: "fixed", zIndex: 9999 };

        // If we can measure the overlay element, use its size for accurate placement
        const el = ref.current;
        const overlayWidth = el?.offsetWidth ?? 320;
        const overlayHeight = el?.offsetHeight ?? 320;

        if (direction === "bottom-right") {
          base.top = rect.bottom + gap;
          base.left = Math.max(8, rect.right - overlayWidth);
          base.width = overlayWidth;
        } else if (direction === "bottom-left") {
          base.top = rect.bottom + gap;
          base.left = Math.max(8, rect.left);
          base.width = overlayWidth;
        } else if (direction === "top-right") {
          // Position above the anchor and align to its right edge
          base.top = Math.max(8, rect.top - gap - overlayHeight);
          base.left = Math.max(8, rect.right - overlayWidth);
          base.width = overlayWidth;
        } else {
          // top-left
          base.top = Math.max(8, rect.top - gap - overlayHeight);
          base.left = Math.max(8, rect.left);
          base.width = overlayWidth;
        }

        // Avoid unnecessary state updates: only set style when a meaningful value changed
        setStyle((prev) => {
          const prevTop = typeof prev.top === "number" ? prev.top : undefined;
          const prevLeft =
            typeof prev.left === "number" ? prev.left : undefined;
          const prevWidth =
            typeof prev.width === "number" ? prev.width : undefined;
          if (
            prevTop === base.top &&
            prevLeft === base.left &&
            prevWidth === base.width
          ) {
            return prev;
          }
          return base;
        });
      } catch (err) {
        // If anchor is not in the DOM or measurement fails, fallback to default
        setStyle((prev) => {
          const fallback = {
            position: "fixed",
            top: gap,
            right: gap,
            zIndex: 9999,
          } as React.CSSProperties;
          if (
            prev.top === fallback.top &&
            prev.right === fallback.right &&
            prev.zIndex === fallback.zIndex
          ) {
            return prev;
          }
          return fallback;
        });
      }
    };

    // Initial compute
    computePosition();

    // Recompute when the overlay element resizes
    let ro: ResizeObserver | null = null;
    const el = ref.current;
    if (typeof ResizeObserver !== "undefined" && el) {
      ro = new ResizeObserver(() => computePosition());
      ro.observe(el);
    }

    // Also recompute on window resize/scroll to keep position correct
    window.addEventListener("resize", computePosition);
    window.addEventListener("scroll", computePosition, true);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", computePosition);
      window.removeEventListener("scroll", computePosition, true);
    };
  }, [entry.options?.anchor, entry.options?.direction, entry.options?.gap]);

  return (
    <div ref={ref} style={style}>
      {entry.node}
    </div>
  );
};

const OverlayHost = React.memo(OverlayHostInner);

export function useOverlayPortal() {
  const ctx = useContext(OverlayPortalContext);
  if (!ctx)
    throw new Error(
      "useOverlayPortal must be used within OverlayPortalProvider"
    );
  return ctx;
}

export type { Direction };
