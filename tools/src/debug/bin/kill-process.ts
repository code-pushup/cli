import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { type PID, killProcesses } from '../utils.js';
import type { KillProcessesBinOptions } from './types.js';

const { commandMatch, pid, verbose, force } = yargs(hideBin(process.argv))
  .version(false)
  .options({
    force: { type: 'boolean', default: false },
    verbose: { type: 'boolean' },
    pid: { type: 'string', array: true, default: [] },
    commandMatch: { type: 'string', array: true, default: [] },
  })
  .coerce('commandMatch', (commandMatch: string[]) =>
    commandMatch.flatMap(p => p.split(',')).filter(p => p !== ''),
  )
  .coerce('pid', (pid: string[]) =>
    pid.flatMap(p => p.split(',')).filter(p => p !== ''),
  ).argv as Omit<KillProcessesBinOptions, 'pid' | 'commandMatch'> & {
  pid: PID[];
  commandMatch: string[];
};
if (verbose && commandMatch.length > 0) {
  console.log(`Command Filter: ${commandMatch.join(', ')}`);
}
if (verbose && pid.length > 0) {
  console.log(`PID Filter: ${pid.join(', ')}`);
}

if (pid.length === 0 && commandMatch.length === 0 && !force) {
  throw new Error(
    'This would kill all processes. Please provide a PID or a command filter and a PID filter. (or pass --force if you really want to kill ALL processes)',
  );
}

killProcesses({ commandMatch, pid, verbose });
