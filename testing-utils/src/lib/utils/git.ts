import {executeProcess, objectToCliArgs} from "@code-pushup/utils";

export async function makeStatusDirty(): Promise<void> {
  await executeProcess({
    command: 'echo',
    args: objectToCliArgs({
      _: ["Some changes", ">>", "some-file.txt"]
    })
  });
}

export async function makeStatusClean(): Promise<void> {
  await executeProcess({
    command: 'echo',
    args: objectToCliArgs({
      _: ["Some changes", ">>", "some-file.txt"]
    })
  });
}
