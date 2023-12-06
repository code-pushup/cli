import { vol } from 'memfs';
import { describe, expect, it } from 'vitest';
import { MEMFS_VOLUME, MINIMAL_CONFIG_MOCK } from '@code-pushup/testing-utils';
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
  });

  it('should execute when no plugins are passed', async () => {
    await expect(
      collect({
        ...MINIMAL_CONFIG_MOCK,
        plugins: [],
        verbose: true,
        progress: false,
      }),
    ).rejects.toThrow('No plugins registered');
  });
});
