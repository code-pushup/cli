import path from 'node:path';

const asyncProcessPath = path.join(__dirname, './execute-process.mock.mjs');

/**
 * Helps to get an async process runner config for testing.
 *
 * @param cfg can contain up to three properties for the async process runner
 */
export function getAsyncProcessRunnerConfig(cfg?: {
  throwError?: boolean;
  interval?: number;
  runs?: number;
}) {
  const args = [
    asyncProcessPath,
    cfg?.interval ? cfg.interval + '' : '100',
    cfg?.runs ? cfg.runs + '' : '4',
    cfg?.throwError ? '1' : '0',
  ];
  return { command: 'node', args };
}
