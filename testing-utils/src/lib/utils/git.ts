import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import simpleGit from 'simple-git';

export async function createGitRepo(options: {
  outputDir: string;
  isDirty?: boolean;
}) {
  const { outputDir, isDirty = false } = options;
  await ensureDirectoryExists(outputDir);
  await simpleGit().init();
  if (isDirty) {
    await writeFile(join(outputDir, 'random.txt'), Math.random().toString());
  }
}

export async function ensureDirectoryExists(baseDir: string) {
  try {
    await mkdir(baseDir, { recursive: true });
    return;
  } catch (error) {
    console.error((error as { code: string; message: string }).message);
    if ((error as { code: string }).code !== 'EEXIST') {
      throw error;
    }
  }
}

export function makeStatusDirty() {
  return new Promise((resolve, reject) => {
    spawn('echo', ['Some changes', '>>', 'some-file.txt'], { shell: true }).on(
      'close',
      code => {
        if (code === 0) {
          resolve(void 0);
        } else {
          reject(void 0);
        }
      },
    );
  });
}

export function makeStatusClean() {
  return new Promise((resolve, reject) => {
    spawn('git', ['clean -fd'], { shell: true }).on('close', code => {
      if (code === 0) {
        resolve(void 0);
      } else {
        reject(void 0);
      }
    });
  });
}
