import { screen } from 'electron';
import { WindowPositioningConfig, WindowBounds } from '../../types/automation.types';
import { Logger } from '../../utils/logger.util';

const logger = new Logger('ScreenPositioner');

export class ScreenPositioner {
  private config: WindowPositioningConfig;
  private occupiedSlots: Set<number> = new Set();
  private nextSlotIndex: number = 0;

  constructor(config: WindowPositioningConfig) {
    this.config = config;
  }

  /**
   * Get next available screen slot
   */
  getNextAvailableSlot(): number {
    const maxSlots = this.config.grid.columns * this.config.grid.rows;
    // Try to find a free slot starting from nextSlotIndex to distribute allocations predictably
    for (let offset = 0; offset < maxSlots; offset++) {
      const idx = (this.nextSlotIndex + offset) % maxSlots;
      if (!this.occupiedSlots.has(idx)) {
        this.occupiedSlots.add(idx);
        this.nextSlotIndex = (idx + 1) % maxSlots;
        logger.info(`Assigned slot ${idx} (${this.occupiedSlots.size}/${maxSlots} occupied)`);
        return idx;
      }
    }

    // No free slots - return the nextSlotIndex (will overlap) and advance pointer
    const slot = this.nextSlotIndex % maxSlots;
    this.nextSlotIndex = (this.nextSlotIndex + 1) % maxSlots;
    logger.warn(`All slots occupied, overlapping at slot ${slot}`);
    return slot;
  }

  /**
   * Release a slot
   */
  releaseSlot(slot: number): void {
    if (this.occupiedSlots.has(slot)) {
      this.occupiedSlots.delete(slot);
      logger.info(`Released slot ${slot}`);
    }
  }

  /**
   * Calculate window bounds for a given slot
   */
  calculateWindowBounds(slot: number, displayId?: number, activeCount?: number): WindowBounds {
    const display = this.getDisplay(displayId);
    const { workArea } = display;

  const { columns, rows, direction, gap, padding } = this.config.grid;

    // If cascade strategy, compute cascading offsets instead of grid cells
    if (this.config.strategy === 'cascade') {
      const { offsetX, offsetY, startX, startY } = this.config.cascade;
      const width = this.config.defaultSize.width;
      const height = this.config.defaultSize.height;
      const x = workArea.x + startX + slot * offsetX;
      const y = workArea.y + startY + slot * offsetY;
      return { x, y, width, height };
    }

    // If fullscreenEach is enabled, every window occupies full work area
    if ((this.config.grid as any).fullscreenEach) {
      const x = workArea.x + padding.left;
      const y = workArea.y + padding.top;
      const width = Math.max(0, workArea.width - padding.left - padding.right);
      const height = Math.max(0, workArea.height - padding.top - padding.bottom);
      return { x, y, width, height };
    }

    // If activeCount is provided and less than total cells, compute an effective grid
    const totalCells = columns * rows;
    let effColumns = columns;
    let effRows = rows;
    if (activeCount && activeCount > 0 && activeCount < totalCells) {
      // try to fit items in fewer rows where possible like CSS grid
      effColumns = Math.min(columns, activeCount);
      effRows = Math.max(1, Math.ceil(activeCount / effColumns));
    }

    // Respect compact flag: remove gaps and padding to create a tight grid
    const useGapX = (this.config.grid as any).compact ? 0 : gap.x;
    const useGapY = (this.config.grid as any).compact ? 0 : gap.y;
    // When compact is enabled keep a small inset so windows don't sit flush to screen edges
    const usePadding = (this.config.grid as any).compact
      ? { top: 8, left: 8, right: 8, bottom: 8 }
      : padding;

    const totalGapX = useGapX * Math.max(0, effColumns - 1);
    const totalGapY = useGapY * Math.max(0, effRows - 1);
    const availableWidth = Math.max(0, workArea.width - usePadding.left - usePadding.right - totalGapX);
    const availableHeight = Math.max(0, workArea.height - usePadding.top - usePadding.bottom - totalGapY);

    const width = Math.floor(availableWidth / effColumns);
    const height = Math.floor(availableHeight / effRows);

    // Calculate slot row/col
    // Map slot into effective grid coordinates
    let col = slot % effColumns;
    let row = Math.floor(slot / effColumns);

    // Apply direction/startCorner adjustments using effective grid dims
    if (direction === 'right-left') {
      col = effColumns - 1 - col;
    }
    if (direction === 'bottom-top') {
      row = effRows - 1 - row;
    }

    // Calculate position within work area (respect compact gaps/padding)
    const x = workArea.x + usePadding.left + col * (width + useGapX);
    const y = workArea.y + usePadding.top + row * (height + useGapY);

  // Determine mode label for logging (full-grid vs active-count)
  const modeLabel = activeCount && activeCount > 0 && activeCount < totalCells ? `active-count=${activeCount}` : 'full-grid';
    const compactFlag = !!(this.config.grid as any).compact;

    logger.info(`Calculated bounds for slot ${slot} (mode=${modeLabel}, eff=${effColumns}x${effRows}, compact=${compactFlag}) => (${x}, ${y}, ${width}x${height})`);

    return { x, y, width, height };
  }

  /**
   * Get display by ID or primary display
   */
  private getDisplay(displayId?: number): Electron.Display {
    const displays = screen.getAllDisplays();
    
    if (displayId !== undefined && displays[displayId]) {
      return displays[displayId];
    }
    
    if (this.config.preferredDisplay === 'secondary' && displays.length > 1) {
      return displays[1];
    }
    
    if (typeof this.config.preferredDisplay === 'number' && displays[this.config.preferredDisplay]) {
      return displays[this.config.preferredDisplay];
    }
    
    return screen.getPrimaryDisplay();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WindowPositioningConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): WindowPositioningConfig {
    return { ...this.config };
  }

  /**
   * Reset all occupied slots
   */
  reset(): void {
    this.occupiedSlots.clear();
    this.nextSlotIndex = 0;
    logger.info('All slots reset');
  }

  /**
   * Get occupied slots count
   */
  getOccupiedCount(): number {
    return this.occupiedSlots.size;
  }
}

/**
 * Default window positioning configuration
 */
export const DEFAULT_WINDOW_CONFIG: WindowPositioningConfig = {
  strategy: 'grid',
  grid: {
    columns: 3,
    rows: 2,
    direction: 'left-right',
    startCorner: 'top-left',
    gap: { x: 10, y: 10 },
    fullscreenEach: false,
    compact: false,
    padding: { top: 50, left: 20, right: 20, bottom: 50 },
  },
  cascade: {
    offsetX: 50,
    offsetY: 50,
    startX: 100,
    startY: 100,
  },
  defaultSize: { width: 1024, height: 768 },
  preferredDisplay: 'primary',
  maxConcurrent: 6,
};
