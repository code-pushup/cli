import { spawn } from 'node:child_process';

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
