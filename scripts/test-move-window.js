const { spawn } = require('child_process');
const util = require('../dist/platform/windows/windows.util');

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

(async () => {
  console.log('Spawning notepad.exe');
  const p = spawn('notepad.exe', [], { detached: true, stdio: 'ignore' });
  try { p.unref(); } catch (e) {}
  const pid = p.pid;
  console.log('Spawned notepad pid=', pid);

  console.log('Waiting 2s for window...');
  await delay(2000);

  console.log('Calling moveWindowByPid...');
  try {
    const ok = util.moveWindowByPid(pid, 100, 100, 800, 600);
    console.log('moveWindowByPid returned', ok);
  } catch (e) {
    console.error('moveWindowByPid threw', e);
  }

  // Close notepad after test
  try { process.kill(pid); } catch (e) {}
  console.log('Done');
})();