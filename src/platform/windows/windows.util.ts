import { spawnSync } from 'child_process';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('WindowsUtil');

/**
 * Move a window by the main window handle of a process id using PowerShell + MoveWindow
 * Returns true if the call succeeded, false otherwise.
 */
export function moveWindowByPid(pid: number, x: number, y: number, width: number, height: number): boolean {
  if (process.platform !== 'win32') {
    logger.warn('moveWindowByPid called on non-win32 platform');
    return false;
  }

  // Build PowerShell script
  const ps = `
  $targetPid = ${pid}
  $proc = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
  if ($null -eq $proc) { exit 2 }
  $hwnd = $proc.MainWindowHandle
  if ($hwnd -eq 0) { exit 3 }
  $sig = @'
using System;
using System.Runtime.InteropServices;
public static class Win32 {
  [DllImport("user32.dll", SetLastError=true)]
  public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
}
'@
Add-Type -TypeDefinition $sig -Language CSharp
[Win32]::MoveWindow([IntPtr]$hwnd, ${x}, ${y}, ${width}, ${height}, $true) | Out-Null
exit 0
`;
  // Improved approach: if MainWindowHandle is not available, enumerate top-level windows
  // to find a visible window that belongs to the PID. Also attempt to restore a maximized
  // window before moving it (ShowWindow(SW_RESTORE)). This makes the native fallback much
  // more reliable with Chrome which often spawns helper processes.
  const psEnum = `
  $targetPid = ${pid}
  $sig = @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class Win32 {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")]
  public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")]
  public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")]
  public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int lpdwProcessId);
  [DllImport("user32.dll", SetLastError=true)]
  public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
'@

Add-Type -TypeDefinition $sig -Language CSharp

  $found = [IntPtr]::Zero
  $callback = [Win32+EnumWindowsProc]{ param($hwnd, $lparam)
    $foundPid = 0
    [Win32]::GetWindowThreadProcessId($hwnd, ([ref]$foundPid)) | Out-Null
    if ($foundPid -eq $targetPid -and [Win32]::IsWindowVisible($hwnd)) {
      $script:found = $hwnd
      return $false
    }
    return $true
  }

[Win32]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
if ($found -eq [IntPtr]::Zero) { exit 3 }

# Restore window (SW_RESTORE = 9) then move
[Win32]::ShowWindow($found, 9) | Out-Null
[Win32]::MoveWindow($found, ${x}, ${y}, ${width}, ${height}, $true) | Out-Null
exit 0
`;

  try {
    // Try primary method first (fast) and fall back to enumeration if it fails
    let result = spawnSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8', timeout: 5000 });
    if (result.error || result.status !== 0) {
      // Try enumeration-based approach
      result = spawnSync('powershell', ['-NoProfile', '-Command', psEnum], { encoding: 'utf8', timeout: 7000 });
    }
    if (result.error) {
      logger.error('PowerShell execution error', result.error);
      // If PowerShell failed, try optional native package as a fallback
      try {
        // optional dependency
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const wnm = require('node-window-manager');
        logger.info('node-window-manager available — attempting native fallback');
        const windows = wnm.windowManager ? wnm.windowManager.getWindows() : (wnm.getWindows ? wnm.getWindows() : []);
        for (const w of windows) {
          try {
            const procId = w.processId || w.processId;
            if (procId === pid) {
              if (typeof w.bringToTop === 'function') try { w.bringToTop(); } catch (e) { /* ignore */ }
              if (typeof w.setBounds === 'function') {
                w.setBounds({ x, y, width, height });
              } else if (typeof w.move === 'function' && typeof w.resize === 'function') {
                w.move(x, y); w.resize(width, height);
              }
              logger.info(`node-window-manager moved window for pid=${pid}`);
              return true;
            }
          } catch (e) { /* continue */ }
        }
      } catch (e) {
        logger.warn('node-window-manager fallback failed or not installed', e);
      }
      return false;
    }
    if (result.status !== 0) {
      logger.warn(`PowerShell returned non-zero exit code: ${result.status}. stderr=${result.stderr}`);
      // Try node-window-manager fallback when PS returns non-zero
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const wnm = require('node-window-manager');
        logger.info('node-window-manager available — attempting native fallback (after PS non-zero)');
        const windows = wnm.windowManager ? wnm.windowManager.getWindows() : (wnm.getWindows ? wnm.getWindows() : []);
        for (const w of windows) {
          try {
            const procId = w.processId || w.processId;
            if (procId === pid) {
              if (typeof w.bringToTop === 'function') try { w.bringToTop(); } catch (e) { /* ignore */ }
              if (typeof w.setBounds === 'function') {
                w.setBounds({ x, y, width, height });
              } else if (typeof w.move === 'function' && typeof w.resize === 'function') {
                w.move(x, y); w.resize(width, height);
              }
              logger.info(`node-window-manager moved window for pid=${pid}`);
              return true;
            }
          } catch (e) { /* continue */ }
        }
      } catch (e) {
        logger.warn('node-window-manager fallback failed or not installed', e);
      }
      return false;
    }
    logger.info(`Moved window for pid=${pid} to ${x},${y} ${width}x${height}`);
    return true;
  } catch (err) {
    logger.error('Failed to run PowerShell moveWindow script', err);
    return false;
  }
}

export default { moveWindowByPid };
