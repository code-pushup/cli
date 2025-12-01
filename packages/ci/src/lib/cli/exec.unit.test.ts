import ansis from 'ansis';
import * as utils from '@code-pushup/utils';
import type { CommandContext } from './context.js';
import { executeCliCommand } from './exec.js';

describe('executeCliCommand', () => {
  const defaultContext: CommandContext = {
    bin: 'npx code-pushup',
    directory: process.cwd(),
    config: null,
    silent: false,
  };

  let observer: utils.ProcessObserver;
  let stdout: string;

  beforeAll(() => {
    // to "see" logged output, we don't mock Logger, but only stdout
    vi.stubEnv('CI', 'true'); // no spinners
    vi.spyOn(utils, 'logger', 'get').mockReturnValue(new utils.Logger());
    vi.spyOn(console, 'log').mockImplementation((message: string) => {
      stdout += `${message}\n`;
    });
    vi.spyOn(process.stdout, 'write').mockImplementation(message => {
      stdout += message.toString();
      return true;
    });
  });

  beforeEach(() => {
    stdout = '';
    vi.spyOn(utils, 'executeProcess').mockImplementation(async config => {
      observer = config.observer!;
      return {} as utils.ProcessResult;
    });
    vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(42); // duration: 42 ms
  });

  it('should execute code-pushup binary', async () => {
    await expect(
      executeCliCommand([], {
        bin: 'npx code-pushup',
        config: null,
        directory: process.cwd(),
        silent: false,
      }),
    ).resolves.toBeUndefined();

    expect(utils.executeProcess).toHaveBeenCalledWith({
      command: 'npx code-pushup',
      args: [],
      cwd: process.cwd(),
      observer: {
        onStdout: expect.any(Function),
        onStderr: expect.any(Function),
        onComplete: expect.any(Function),
        onError: expect.any(Function),
      },
      silent: true,
    } satisfies utils.ProcessConfig);
  });

  it('should execute code-pushup with custom args', async () => {
    await expect(
      executeCliCommand(
        ['print-config', '--output=.code-pushup/code-pushup.config.json'],
        defaultContext,
      ),
    ).resolves.toBeUndefined();

    expect(utils.executeProcess).toHaveBeenCalledWith(
      expect.objectContaining({
        args: ['print-config', '--output=.code-pushup/code-pushup.config.json'],
      } satisfies Partial<utils.ProcessConfig>),
    );
  });

  it('should execute code-pushup with custom config file', async () => {
    await expect(
      executeCliCommand([], { ...defaultContext, config: 'cp.config.js' }),
    ).resolves.toBeUndefined();

    expect(utils.executeProcess).toHaveBeenCalledWith(
      expect.objectContaining({
        args: ['--config=cp.config.js'],
      } satisfies Partial<utils.ProcessConfig>),
    );
  });

  it('should execute code-pushup with explicit default formats', async () => {
    await expect(
      executeCliCommand([], defaultContext, { hasFormats: false }),
    ).resolves.toBeUndefined();

    expect(utils.executeProcess).toHaveBeenCalledWith(
      expect.objectContaining({
        args: ['--persist.format=json', '--persist.format=md'],
      } satisfies Partial<utils.ProcessConfig>),
    );
  });

  it('should execute code-pushup without explicit formats if already detected', async () => {
    await expect(
      executeCliCommand([], defaultContext, { hasFormats: true }),
    ).resolves.toBeUndefined();

    expect(utils.executeProcess).toHaveBeenCalledWith(
      expect.objectContaining({
        args: [],
      } satisfies Partial<utils.ProcessConfig>),
    );
  });

  it('should execute code-pushup from custom working directory', async () => {
    await expect(
      executeCliCommand([], { ...defaultContext, directory: 'apps/website' }),
    ).resolves.toBeUndefined();

    expect(utils.executeProcess).toHaveBeenCalledWith(
      expect.objectContaining({
        cwd: 'apps/website',
      } satisfies Partial<utils.ProcessConfig>),
    );
  });

  it('should log command, args, status and duration', async () => {
    await executeCliCommand([], defaultContext);

    expect(ansis.strip(stdout)).toBe(
      `
- $ npx code-pushup
✔ $ npx code-pushup (42 ms)
`.trimStart(),
    );
  });

  it('should log raw process stdout and stderr in output order', async () => {
    const task = executeCliCommand([], defaultContext);
    observer.onStdout!('Code PushUp CLI v0.42.0\n');
    observer.onStderr!('WARN: API key is missing, skipping upload\n');
    observer.onStdout!('Collected report files in ');
    observer.onStdout!('.code-pushup directory\n');
    observer.onComplete!();
    await task;

    expect(ansis.strip(stdout)).toBe(
      `
- $ npx code-pushup

Code PushUp CLI v0.42.0
WARN: API key is missing, skipping upload
Collected report files in .code-pushup directory

✔ $ npx code-pushup (42 ms)
`.trimStart(),
    );
  });

  it('should log process output immediately, without waiting for process to complete', async () => {
    const task = executeCliCommand([], defaultContext);

    expect(ansis.strip(stdout)).toBe(
      `
- $ npx code-pushup
`.trimStart(),
    );

    observer.onStdout!('Collected report\n');

    expect(ansis.strip(stdout)).toBe(
      `
- $ npx code-pushup

Collected report
`.trimStart(),
    );

    observer.onStdout!('Uploaded report to portal\n');

    expect(ansis.strip(stdout)).toBe(
      `
- $ npx code-pushup

Collected report
Uploaded report to portal
`.trimStart(),
    );

    observer.onComplete!();
    await task;

    expect(ansis.strip(stdout)).toBe(
      `
- $ npx code-pushup

Collected report
Uploaded report to portal

✔ $ npx code-pushup (42 ms)
`.trimStart(),
    );
  });

  it('should log failed process output', async () => {
    const error = new utils.ProcessError({ code: 1 } as utils.ProcessResult);
    vi.spyOn(utils, 'executeProcess').mockImplementation(async config => {
      observer = config.observer!;
      throw error;
    });

    const task = executeCliCommand([], defaultContext);
    observer.onStdout!('Code PushUp CLI v0.42.0\n');
    observer.onStderr!('ERROR: Config file not found\n');
    observer.onError!(error);
    await expect(task).rejects.toThrow(error);

    expect(ansis.strip(stdout)).toBe(
      `
- $ npx code-pushup

Code PushUp CLI v0.42.0
ERROR: Config file not found

✖ $ npx code-pushup
`.trimStart(),
    );
  });

  it('should not log process output if silent flag is set', async () => {
    const task = executeCliCommand([], { ...defaultContext, silent: true });
    observer.onStdout!('Code PushUp CLI v0.42.0\n');
    observer.onComplete!();
    await task;

    expect(ansis.strip(stdout)).toBe(
      `
- $ npx code-pushup
✔ $ npx code-pushup (42 ms)
`.trimStart(),
    );
  });

  it('should log failed process output even if silent flag is set', async () => {
    const error = new utils.ProcessError({ code: 1 } as utils.ProcessResult);
    vi.spyOn(utils, 'executeProcess').mockImplementation(async config => {
      observer = config.observer!;
      throw error;
    });

    const task = executeCliCommand([], { ...defaultContext, silent: true });
    observer.onStdout!('Code PushUp CLI v0.42.0\n');
    observer.onStderr!('ERROR: Config file not found\n');
    observer.onError!(error);
    await expect(task).rejects.toThrow(error);

    expect(ansis.strip(stdout)).toBe(
      `
- $ npx code-pushup

Code PushUp CLI v0.42.0
ERROR: Config file not found

✖ $ npx code-pushup
`.trimStart(),
    );
  });
});
