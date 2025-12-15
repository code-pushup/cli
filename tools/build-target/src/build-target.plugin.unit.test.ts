import { describe, expect, it } from 'vitest';
import { createBuildTargetConfig } from './build-target.plugin';

describe('createBuildTargetConfig', () => {
  it('should return the correct target config', () => {
    expect(createBuildTargetConfig()).toStrictEqual({
      dependsOn: ['^build'],
      inputs: ['production', '^production'],
      cache: true,
      executor: '@nx/js:tsc',
      outputs: ['{options.outputPath}'],
      options: {
        outputPath: '{projectRoot}/dist',
        main: '{projectRoot}/src/index.ts',
        tsConfig: `{projectRoot}/tsconfig.lib.json`,
        assets: ['{projectRoot}/*.md'],
      },
    });
  });
});
