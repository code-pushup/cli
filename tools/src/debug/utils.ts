import { execSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as os from 'os';

export type PID = string | number;
export type ProcessListOption = {
  pid?: PID | PID[];
  commandMatch?: string | string[];
  verbose?: boolean;
};

export function listProcess({ pid, commandMatch }: ProcessListOption = {}): {
  pid: string;
  command: string;
}[] {
  const pids = pid ? (Array.isArray(pid) ? pid : [pid]) : [];
  const commands = (
    commandMatch
      ? Array.isArray(commandMatch)
        ? commandMatch
        : [commandMatch]
      : []
  ).map(command => {
    // normalize command string
    return command.trim().replace(/\\/g, '').replace(/"/g, '');
  });
  let listProcessCommand: string;

  const platform = os.platform();
  if (platform === 'darwin' || platform === 'linux') {
    listProcessCommand = 'ps -eo pid,command';
  } else if (platform === 'win32') {
    listProcessCommand = 'wmic process get ProcessId,CommandLine';
  } else {
    throw new Error('Unsupported platform: ' + platform);
  }

  const processList = execSync(listProcessCommand)
    .toString()
    /**
     * Before:
     * 63595: nx start-verdaccio-server
     * 63598: node ./node_modules/nx/src/tasks-runner/fork.js /var/folders/8k/xw46d2r95dx_s4n7t52sn8vc0000gn/T/5d4fb7ed27f13663ee6d/fp63595.sock @code-pushup/cli-source:start-verdaccio-server
     * 27560: verdaccio
     * 63648: tsx --tsconfig=tools/tsconfig.tools.json tools/src/debug/bin/list-process.ts --verbose=true --slice=9 --pid= --commandMatch=verdaccio
     * 63649: /usr/local/bin/node --require ./node_modules/tsx/dist/preflight.cjs --loader file:///Users/michael_hladky/WebstormProjects/quality-metrics-cli/node_modules/tsx/dist/loader.mjs tools/src/debug/bin/list-process.ts --verbose=true --slice=9 --pid= --commandMatch=verdaccio
     * 63643: nx list-process --commandMatch verdaccio --verbose
     *
     * After:
     * 63595: nx start-verdaccio-server
     * 63598: node ./node_modules/nx/src/tasks-runner/fork.js /var/folders/8k/xw46d2r95dx_s4n7t52sn8vc0000gn/T/5d4fb7ed27f13663ee6d/fp63595.sock @code-pushup/cli-source:start-verdaccio-server
     * 63607: verdaccio
     */
    // split stdout into lines
    .trim()
    .split('\n')
    .filter(line => line.trim() !== '')
    .filter(
      line =>
        !line.includes('tools/src/debug/bin/list-process.ts') &&
        !line.includes('nx list-process'),
    );

  return processList
    .map(line => {
      const parts = line
        .trim()
        .split(/\s+/)
        .map(part => part.trim());
      return {
        pid: parts[0] ?? '',
        command: parts.slice(1).join(' '),
      };
    })
    .map(({ pid, command }) => ({
      pid,
      command: command
        .replace(process.cwd(), '.')
        .replace(`node ./${path.join('node_modules', '.bin')}/`, ''),
    }))
    .filter(({ pid, command }) => {
      if (pids.length === 0 && commands.length === 0) {
        return true;
      }

      if (pids.length > 0) {
        // filter for exact matches
        return pids.some(p => p === pid);
      }

      // filter for exact matches
      return commands.some(commandPart => command.includes(commandPart));
    });
}

export function killProcessPid(pid: number | string, command?: string): void {
  const commandString = command ? `, command: ${command}` : '';
  try {
    // @TODO sometimes pid is NaN, figure out if this is caused by trying to kill a process that is already stopped
    if (Number.isNaN(Number(pid))) {
      console.info(
        `Can't kill process as pid is not a number. \nPID: ${pid} for command ${commandString}`,
      );
    } else {
      process.kill(Number(pid), 'SIGKILL');
      console.info(`Killed process with PID: ${pid} ${commandString}`);
    }
  } catch (error) {
    console.error(
      `Failed to kill process with PID: ${pid} ${commandString}`,
      error,
    );
  }
}

export function killProcesses(opt: ProcessListOption): void {
  const processes = listProcess(opt);

  if (processes.length > 0) {
    processes.forEach(proc => {
      killProcessPid(proc.pid, proc.command);
    });
  } else {
    console.info(`No processes found. Filter: ${JSON.stringify(opt, null, 2)}`);
  }
}

export type NpmScope = 'global' | 'user' | 'project';

export function getNpmrcPath(scope: NpmScope = 'user'): string {
  try {
    const npmConfigArg = scope === 'global' ? 'globalconfig' : 'userconfig';
    return execSync(`npm config get ${npmConfigArg}`).toString().trim();
  } catch (error) {
    throw new Error(
      `Failed to retrieve .npmrc path: ${(error as Error).message}`,
    );
  }
}

export type CleanNpmrcOptions = {
  userconfig?: string;
  entryMatch: string | string[];
};

export async function cleanNpmrc(options: CleanNpmrcOptions): Promise<void> {
  const { userconfig = getNpmrcPath(), entryMatch: rawEntriesToRemove = [] } =
    options;
  const entriesToRemove = Array.isArray(rawEntriesToRemove)
    ? rawEntriesToRemove
    : [rawEntriesToRemove];

  try {
    const fileContent = await readFile(userconfig, 'utf-8');

    const filteredEntries: string[] = [];
    const updatedContent = fileContent
      .split('\n')
      .filter(line => {
        if (entriesToRemove.length <= 0) {
          return true;
        }

        const trimmedLine = line.trim();
        // Ignore empty lines or comments
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          return true;
        }

        const isMatch = entriesToRemove.some(key => trimmedLine.includes(key));
        isMatch && filteredEntries.push(trimmedLine);
        return !isMatch;
      })
      .join('\n');
    await writeFile(userconfig, updatedContent, 'utf-8');
    console.log(
      `Successfully cleaned ${userconfig} with filter ${entriesToRemove.join(
        ', ',
      )}.`,
    );
    if (filteredEntries.length > 0) {
      console.log(`Removed keys: \n${filteredEntries.join(', ')}`);
    } else {
      console.log(`No entries removed.`);
    }
  } catch (error) {
    console.error(`Error processing ${userconfig}:`, error);
  }
}
