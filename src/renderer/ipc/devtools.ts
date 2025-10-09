import { hasWindow, safeCall } from './invoke';

export const devtools = {
  toggle: () => {
    if (hasWindow() && (window.electronAPI as any)?.devtools?.toggle) {
      safeCall(() => (window.electronAPI as any).devtools.toggle());
    }
  },
  open: () => {
    if (hasWindow() && (window.electronAPI as any)?.devtools?.open) {
      safeCall(() => (window.electronAPI as any).devtools.open());
    }
  },
  close: () => {
    if (hasWindow() && (window.electronAPI as any)?.devtools?.close) {
      safeCall(() => (window.electronAPI as any).devtools.close());
    }
  },
};
