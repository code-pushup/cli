import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { PID, listProcess } from '../utils';
import { ListProcessesBinOptions } from './types';

const { commandMatch, pid, verbose, slice } = yargs(hideBin(process.argv))
  .version(false)
  .options({
    verbose: { type: 'boolean' },
    commandMatch: { type: 'string', array: true, default: [] },
    pid: { type: 'string', array: true, default: [] },
    slice: { type: 'number', default: 9 },
  })
  .coerce('commandMatch', (commandMatch: string[]) =>
    commandMatch.flatMap(p => p.split(',')).filter(p => p !== ''),
  )
  .coerce('pid', (pid: string[]) =>
    pid.flatMap(p => p.split(',')).filter(p => p !== ''),
  ).argv as Omit<ListProcessesBinOptions, 'pid' | 'commandMatch' | 'slice'> & {
  pid: PID[];
  commandMatch: string[];
} & {
  slice: number;
};

if (verbose && commandMatch.length < 0) {
  console.log(`Command Match: ${commandMatch.join(', ')}`);
}

if (verbose && pid.length < 0) {
  console.log(`Command Match: ${pid.join(', ')}`);
}

const processesToLog = listProcess({ commandMatch, pid }).slice(-slice); // show only last N processes

if (processesToLog.length === 0) {
  console.info(
    `No processes found. Filter: ${JSON.stringify(
      { commandMatch, pid },
      null,
      2,
    )}`,
  );
}

processesToLog.forEach(({ pid, command }) => {
  console.log(`${pid}: ${command}`);
});
