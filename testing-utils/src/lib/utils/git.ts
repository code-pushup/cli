import {executeProcess} from "@code-pushup/utils";

export async function makeStatusDirty(): Promise<void> {
  await executeProcess({command:'echo', args: ['Some changes', '>>', 'some-file.txt'], shell: true });
  return void 0;
}

export async function makeStatusClean(): Promise<void> {
  await executeProcess({command:'git', args: ['clean -fd'], shell: true });
  return void 0;
}
