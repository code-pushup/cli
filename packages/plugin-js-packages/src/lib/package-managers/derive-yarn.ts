import { executeProcess, isVerbose } from '@code-pushup/utils';

export async function deriveYarnVersion() {
  const { stdout } = await executeProcess({
    verbose: isVerbose(),
    command: 'yarn',
    args: ['-v'],
  });

  const yarnVersion = Number.parseInt(stdout.toString().trim().at(0) ?? '', 10);
  if (yarnVersion >= 2) {
    return 'yarn-modern';
  } else if (yarnVersion === 1) {
    return 'yarn-classic';
  }
  return false;
}
