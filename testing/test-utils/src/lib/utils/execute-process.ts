import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export async function executeProcess(cfg: {
  command: string;
  args: string[];
  cwd: string;
}) {
  const execFileAsync = promisify(execFile);
  const { command, args, cwd } = cfg;
  return await execFileAsync(command, args, { cwd });
}
