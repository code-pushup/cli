import {spawn} from 'node:child_process';

export function makeStatusDirty() {
   spawn('echo', ['Some changes', '>>', 'some-file.txt'], { shell: true });
}

export function makeStatusClean() {
  spawn('git', ['clean -fd'], { shell: true });
}
