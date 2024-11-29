import { vol } from 'memfs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { parseLcovFiles } from './lcov-runner.js';

describe('parseLcovFiles', () => {
  const UTILS_REPORT = `
TN:
SF:${join('common', 'utils.ts')}
FNF:0
FNH:0
DA:1,1
DA:2,0
LF:2
LH:1
BRDA:1,0,0,6
BRF:1
BRH:1
end_of_record
`;

  const CONSTANTS_REPORT = `
TN:
SF:${join('src', 'lib', 'constants.ts')}
FNF:0
FNH:0
DA:1,1
LF:1
LH:1
BRF:0
BRH:0
end_of_record
`;

  beforeEach(() => {
    vol.fromJSON(
      {
        [join('integration-tests', 'lcov.info')]: UTILS_REPORT, // file name value under SF used in tests
        [join('unit-tests', 'lcov.info')]: CONSTANTS_REPORT, // file name value under SF used in tests
        'lcov.info': '', // empty report file
      },
      'coverage',
    );
  });

  it('should identify coverage path passed as a string', async () => {
    await expect(
      parseLcovFiles([join('coverage', 'integration-tests', 'lcov.info')]),
    ).resolves.toEqual([
      expect.objectContaining({ file: join('common', 'utils.ts') }),
    ]);
  });

  it('should identify coverage path passed as an object and prepend project path to LCOV report', async () => {
    await expect(
      parseLcovFiles([
        {
          resultsPath: join('coverage', 'unit-tests', 'lcov.info'),
          pathToProject: join('packages', 'cli'),
        },
      ]),
    ).resolves.toEqual([
      expect.objectContaining({
        file: join('packages', 'cli', 'src', 'lib', 'constants.ts'),
      }),
    ]);
  });

  it('should correctly identify a mix of coverage path formats', async () => {
    await expect(
      parseLcovFiles([
        {
          resultsPath: join('coverage', 'unit-tests', 'lcov.info'),
          pathToProject: join('packages', 'cli'),
        },
        join('coverage', 'integration-tests', 'lcov.info'),
      ]),
    ).resolves.toEqual([
      expect.objectContaining({
        file: join('packages', 'cli', 'src', 'lib', 'constants.ts'),
      }),
      expect.objectContaining({
        file: join('common', 'utils.ts'),
      }),
    ]);
  });

  it('should throw for only empty reports', async () => {
    await expect(() =>
      parseLcovFiles([join('coverage', 'lcov.info')]),
    ).rejects.toThrow('All provided results are empty.');
  });

  it('should warn about an empty lcov file', async () => {
    await parseLcovFiles([
      join('coverage', 'integration-tests', 'lcov.info'),
      join('coverage', 'lcov.info'),
    ]);

    expect(getLogMessages(ui().logger)[0]).toContain(
      `Coverage plugin: Empty lcov report file detected at ${join(
        'coverage',
        'lcov.info',
      )}`,
    );
  });
});
