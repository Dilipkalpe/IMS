import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const port = process.argv[2] || '3000';

async function killPort() {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const pids = new Set();
    for (const line of stdout.split(/\r?\n/)) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts.at(-1);
      if (pid && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try {
        await execAsync(`taskkill /PID ${pid} /F`);
        console.log(`Stopped PID ${pid} (port ${port})`);
      } catch {
        // already gone
      }
    }
    if (pids.size === 0) console.log(`Port ${port} is free.`);
  } catch {
    console.log(`Port ${port} is free.`);
  }
}

killPort();
