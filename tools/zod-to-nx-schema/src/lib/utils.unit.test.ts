import { describe, expect, it } from 'vitest';
import { toPascalCaseSchemaName } from './utils.js';

describe('toPascalCaseSchemaName', () => {
  it('should convert default export to DefaultSchema', () => {
    expect(toPascalCaseSchemaName('default')).toBe('DefaultSchema');
  });

  it('should convert camelCase export names to PascalCase with Schema suffix', () => {
    expect(toPascalCaseSchemaName('basicExecutorOptions')).toBe(
      'BasicExecutorOptionsSchema',
    );
    expect(toPascalCaseSchemaName('myOptions')).toBe('MyOptionsSchema');
    expect(toPascalCaseSchemaName('userConfig')).toBe('UserConfigSchema');
  });

  it('should convert kebab-case export names to PascalCase with Schema suffix', () => {
    expect(toPascalCaseSchemaName('my-config')).toBe('MyConfigSchema');
    expect(toPascalCaseSchemaName('user-settings')).toBe('UserSettingsSchema');
    expect(toPascalCaseSchemaName('basic-executor-options')).toBe(
      'BasicExecutorOptionsSchema',
    );
  });

  it('should convert snake_case export names to PascalCase with Schema suffix', () => {
    expect(toPascalCaseSchemaName('user_settings')).toBe('UserSettingsSchema');
    expect(toPascalCaseSchemaName('my_config')).toBe('MyConfigSchema');
    expect(toPascalCaseSchemaName('basic_executor_options')).toBe(
      'BasicExecutorOptionsSchema',
    );
  });

  it('should not duplicate Schema suffix if already present', () => {
    expect(toPascalCaseSchemaName('testSchema')).toBe('TestSchema');
    expect(toPascalCaseSchemaName('MyExecutorSchema')).toBe('MyExecutorSchema');
    expect(toPascalCaseSchemaName('basicSchema')).toBe('BasicSchema');
  });

  it('should handle mixed case and special characters', () => {
    expect(toPascalCaseSchemaName('My-Special_Config')).toBe(
      'MySpecialConfigSchema',
    );
    expect(toPascalCaseSchemaName('testConfigOptions')).toBe(
      'TestConfigOptionsSchema',
    );
  });

  it('should handle single words', () => {
    expect(toPascalCaseSchemaName('config')).toBe('ConfigSchema');
    expect(toPascalCaseSchemaName('options')).toBe('OptionsSchema');
  });
});
