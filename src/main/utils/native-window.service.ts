import { Logger } from '../../shared/utils/logger';
import { moveWindowByPid as psMove } from '../../platform/windows/windows.util';

const logger = new Logger('NativeWindow');

let nativeAvailable = false;
let nw: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  nw = require('node-window-manager');
  nativeAvailable = !!nw;
  if (nativeAvailable) logger.info('node-window-manager available for native window control');
} catch (err) {
  logger.info('node-window-manager not available, will fall back to PowerShell method');
}

export function moveWindowByPid(pid: number, x: number, y: number, width: number, height: number): boolean {
  if (nativeAvailable && nw) {
    try {
      const windows = nw.Window.getWindows();
      const w = windows.find((win: any) => win.processId === pid || win.processId === Number(pid));
      if (!w) {
        logger.warn(`Native window-manager, no window found for pid=${pid}`);
        return false;
      }
      w.setBounds({ x, y, width, height });
      logger.info(`Native moved window for pid=${pid}`);
      return true;
    } catch (err) {
      logger.error('Native moveWindow failed', err);
      // fall through to PS fallback
    }
  }

  // Fallback to PowerShell method
  return psMove(pid, x, y, width, height);
}

export default { moveWindowByPid };
