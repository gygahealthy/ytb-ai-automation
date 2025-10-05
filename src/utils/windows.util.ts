import { spawnSync } from 'child_process';
import { Logger } from '../utils/logger.util';

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
$pid = ${pid}
$proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
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

  try {
    const result = spawnSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8', timeout: 5000 });
    if (result.error) {
      logger.error('PowerShell execution error', result.error);
      return false;
    }
    if (result.status !== 0) {
      logger.warn(`PowerShell returned non-zero exit code: ${result.status}. stderr=${result.stderr}`);
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
