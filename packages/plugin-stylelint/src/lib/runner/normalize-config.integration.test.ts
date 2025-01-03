import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getNormalizedConfigForFile } from './normalize-config';

describe('getNormalizedConfigForFile', () => {
  it('should load config from specified configFile and respect the value of specifically set rules', async () => {
    const configFile = path.join(
      process.cwd(),
      'packages/plugin-stylelint/mocks/fixtures/basic/.stylelintrc.json',
    );

    const parsed = await getNormalizedConfigForFile({ configFile });

    expect(parsed.config.rules['block-no-empty']).toStrictEqual([
      'impossibleValue',
    ]); // The default value is [ true ], so having the not even valid value from the config file is correct
  });

  it('should load config from specified configFile and add default rules', async () => {
    const configFile = path.join(
      process.cwd(),
      'packages/plugin-stylelint/mocks/fixtures/basic/.stylelintrc.json',
    );

    const parsed = await getNormalizedConfigForFile({ configFile });
    expect(Object.keys(parsed.config.rules).length).toBeGreaterThan(1);
  });
});
