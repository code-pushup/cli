import { expect } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import config554 from '../../mocks/fixtures/default-ts-configs/5.5.4.js';
import { AUDITS, GROUPS } from './constants.js';
import * as runnerUtilsModule from './runner/utils.js';
import { typescriptPlugin } from './typescript-plugin.js';

describe('typescriptPlugin-config-object', () => {
  const loadTsConfigDefaultsByVersionSpy = vi
    .spyOn(runnerUtilsModule, 'loadTsConfigDefaultsByVersion')
    .mockResolvedValue(config554 as any);
  const loadTargetConfigSpy = vi
    .spyOn(runnerUtilsModule, 'loadTargetConfig')
    .mockResolvedValue({
      options: {
        verbatimModuleSyntax: false,
      },
      fileNames: [],
      errors: [],
    });

  it('should create valid plugin config without options', async () => {
    const pluginConfig = await typescriptPlugin();

    expect(loadTsConfigDefaultsByVersionSpy).toHaveBeenCalledTimes(1);
    expect(loadTargetConfigSpy).toHaveBeenCalledTimes(1);
    expect(loadTargetConfigSpy).toHaveBeenCalledWith(
      expect.stringContaining('tsconfig.json'),
    );
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const { audits, groups } = pluginConfig;
    expect(audits).toHaveLength(AUDITS.length - 1); // as verbatimModuleSyntax is set to false
    expect(groups).toBeDefined();
    expect(groups!).toHaveLength(GROUPS.length);
  });

  it('should create valid plugin config', async () => {
    const pluginConfig = await typescriptPlugin({
      tsConfigPath: 'mocked-away/tsconfig.json',
    });

    expect(loadTsConfigDefaultsByVersionSpy).toHaveBeenCalledTimes(1);
    expect(loadTargetConfigSpy).toHaveBeenCalledTimes(1);
    expect(loadTargetConfigSpy).toHaveBeenCalledWith(
      expect.stringContaining('mocked-away/tsconfig.json'),
    );
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const { audits, groups } = pluginConfig;
    expect(audits).toHaveLength(AUDITS.length - 1); // as verbatimModuleSyntax is set to false
    expect(groups).toBeDefined();
    expect(groups!).toHaveLength(GROUPS.length);
  });
});
