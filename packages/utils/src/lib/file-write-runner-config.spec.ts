import { platform } from 'os';
import { join } from 'path';
import { describe, it } from 'vitest';
import { createFileWriteRunnerConfig } from './file-write-runner-config';
import { toUnixPath } from './utils';

describe('file-write-runner-config', () => {
  it('create runner config for file write operation', () => {
    const audits = [
      {
        title: 'Require or disallow "Yoda" conditions',
        slug: 'yoda',
        value: 0,
        score: 1,
      },
      {
        title: 'Require the use of `===` and `!==`',
        slug: 'eqeqeq',
        value: 1,
        score: 0,
      },
    ];

    const osAuditOutput =
      platform() === 'win32'
        ? JSON.stringify(audits)
        : "'" + JSON.stringify(audits) + "'";

    const filePath = join(process.cwd(), 'tmp/report.json');
    const unixFilePath = toUnixPath(filePath);

    expect(createFileWriteRunnerConfig(audits, filePath)).toStrictEqual({
      command: 'echo',
      args: [osAuditOutput, '>', unixFilePath],
      outputFile: unixFilePath,
    });
  });
});
