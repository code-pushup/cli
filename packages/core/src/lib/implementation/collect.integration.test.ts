import { vol } from 'memfs';
import { describe, expect, it } from 'vitest';
import { commitSchema } from '@code-pushup/models';
import { MEMFS_VOLUME, MINIMAL_CONFIG_MOCK } from '@code-pushup/test-utils';
import { collect } from './collect';

describe('collect', () => {
  it('should execute with valid options', async () => {
    vol.fromJSON({}, MEMFS_VOLUME);
    const report = await collect({
      ...MINIMAL_CONFIG_MOCK,
      verbose: true,
      progress: false,
    });

    expect(report.plugins[0]?.audits[0]).toEqual(
      expect.objectContaining({
        slug: 'node-version',
        displayValue: '16.0.0',
        details: {
          issues: [
            {
              severity: 'error',
              message:
                'The required Node version to run Code PushUp CLI is 18.',
            },
          ],
        },
      }),
    );

    expect(() => commitSchema.parse(report.commit)).not.toThrow();
  });
});
