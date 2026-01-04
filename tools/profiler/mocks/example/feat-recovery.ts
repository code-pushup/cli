import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { getProfiler } from '@code-pushup/profiler';

const enabled =
  process.argv.includes('--enable-profiler') ||
  process.env['PROFILER_ENABLED'] === 'true';

async function testRecovery() {
  const tmpDir = path.resolve('tmp', 'profiles');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const baseName = 'recovery-test';
  const findFile = (ext: string) => {
    const files = readdirSync(tmpDir)
      .filter(f => f.startsWith(baseName) && f.endsWith(ext))
      .sort();
    const file = files[files.length - 1];
    return file ? path.join(tmpDir, file) : null;
  };

  const p1 = getProfiler({ fileBaseName: baseName, outDir: tmpDir, enabled });
  p1.mark('test-mark-1');
  p1.mark('test-mark-2');
  p1.measure('test-measure', 'test-mark-1', 'test-mark-2');
  p1.close();

  const jsonlFile = findFile('.jsonl');
  if (jsonlFile) {
    writeFileSync(
      jsonlFile,
      readFileSync(jsonlFile, 'utf8') +
        '{"corrupt": "line", "missing": "brace"\n',
    );
  }

  (globalThis as any)[Symbol.for('codepushup.profiler')] = undefined;
  const p2 = getProfiler({
    fileBaseName: baseName,
    outDir: tmpDir,
    enabled,
    recoverJsonl: true,
  });
  p2.mark('recovered-mark');
  p2.close();
}

testRecovery().catch(console.error);
