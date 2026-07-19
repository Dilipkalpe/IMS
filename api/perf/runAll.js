import 'dotenv/config';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, '..');

function runNode(script, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, script)], {
      cwd: apiRoot,
      stdio: 'inherit',
      env: { ...process.env, ...env }
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`))));
  });
}

async function main() {
  if (process.env.PERF_SKIP_SEED !== '1') {
    console.log('=== Step 1: Seed load data ===');
    await runNode('seedLoadData.js', { PERF_PURGE: process.env.PERF_PURGE || '1' });
  } else {
    console.log('=== Step 1: Seed skipped (PERF_SKIP_SEED=1) ===');
  }

  console.log('\n=== Step 2: Analyze queries ===');
  await runNode('analyzeQueries.js');

  console.log('\n=== Step 3: API benchmarks (ensure API is running) ===');
  await runNode('runBenchmarks.js');

  console.log('\n=== Step 4: Generate report ===');
  await runNode('generateReport.js');

  console.log('\nAll performance steps finished.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
