import { spawn } from 'child_process';
import { moveWindowByPid } from '../dist/platform/windows/windows.util';

async function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }

(async () => {
  console.log('Spawning notepad.exe');
  const p = spawn('notepad.exe', [], { detached: true, stdio: 'ignore' });
  try { p.unref(); } catch (e) {}
  const pid = (p as any).pid;
  console.log('Spawned notepad pid=', pid);

  console.log('Waiting 2s for window...');
  await delay(2000);

  console.log('Calling moveWindowByPid...');
  const ok = moveWindowByPid(pid, 100, 100, 800, 600);
  console.log('moveWindowByPid returned', ok);

  // Close notepad after test
  try { process.kill(pid); } catch (e) {}
  console.log('Done');
})();