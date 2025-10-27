import { ipcMain, BrowserWindow } from 'electron';

/**
 * Register DevTools IPC handlers
 */
export function registerDevToolsHandlers(): void {
  // Toggle DevTools
  ipcMain.on('devtools:toggle', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      if (window.webContents.isDevToolsOpened()) {
        window.webContents.closeDevTools();
      } else {
        window.webContents.openDevTools();
      }
    }
  });

  // Open DevTools
  ipcMain.on('devtools:open', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window && !window.webContents.isDevToolsOpened()) {
      window.webContents.openDevTools();
    }
  });

  // Close DevTools
  ipcMain.on('devtools:close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window && window.webContents.isDevToolsOpened()) {
      window.webContents.closeDevTools();
    }
  });

  console.log('✅ DevTools IPC handlers registered');
}
