import { executeProcess } from '@code-pushup/utils';

export async function deriveYarnVersion() {
  const { stdout } = await executeProcess({
    command: 'yarn',
    args: ['-v'],
  });

  const yarnVersion = stdout.toString().trim().at(0);
  if (yarnVersion === '2' || yarnVersion === '3') {
    return 'yarn-modern';
  } else if (yarnVersion === '1') {
    return 'yarn-classic';
  }
  return false;
}
