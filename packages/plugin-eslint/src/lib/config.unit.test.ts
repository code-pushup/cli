import { describe, expect, it } from 'vitest';
import { eslintPluginConfigSchema, eslintTargetSchema } from './config.js';

describe('eslintTargetSchema', () => {
  it('should accept string patterns', () => {
    expect(eslintTargetSchema.parse('src/**/*.ts')).toStrictEqual({
      patterns: 'src/**/*.ts',
    });
  });

  it('should accept array patterns', () => {
    expect(eslintTargetSchema.parse(['src', 'lib'])).toStrictEqual({
      patterns: ['src', 'lib'],
    });
  });

  it('should accept object with patterns', () => {
    expect(
      eslintTargetSchema.parse({ patterns: ['src/**/*.ts'] }),
    ).toStrictEqual({
      patterns: ['src/**/*.ts'],
    });
  });

  it('should accept object with eslintrc and patterns', () => {
    expect(
      eslintTargetSchema.parse({
        eslintrc: 'eslint.config.js',
        patterns: ['src'],
      }),
    ).toStrictEqual({
      eslintrc: 'eslint.config.js',
      patterns: ['src'],
    });
  });

  it('should use default patterns when only eslintrc is provided', () => {
    expect(eslintTargetSchema.parse({ eslintrc: 'eslint.config.js' })).toEqual({
      eslintrc: 'eslint.config.js',
      patterns: '.',
    });
  });

  it('should use default patterns when empty object is provided', () => {
    expect(eslintTargetSchema.parse({})).toStrictEqual({
      patterns: '.',
    });
  });
});

describe('eslintPluginConfigSchema', () => {
  it('should use default patterns when undefined is provided', () => {
    expect(eslintPluginConfigSchema.parse(undefined)).toStrictEqual([
      { patterns: '.' },
    ]);
  });

  it('should use default patterns when empty object is provided', () => {
    expect(eslintPluginConfigSchema.parse({})).toStrictEqual([
      { patterns: '.' },
    ]);
  });

  it('should accept string patterns', () => {
    expect(eslintPluginConfigSchema.parse('src')).toStrictEqual([
      { patterns: 'src' },
    ]);
  });

  it('should accept array of targets', () => {
    expect(
      eslintPluginConfigSchema.parse([
        { patterns: ['src'] },
        { eslintrc: 'custom.config.js', patterns: ['lib'] },
      ]),
    ).toStrictEqual([
      { patterns: ['src'] },
      { eslintrc: 'custom.config.js', patterns: ['lib'] },
    ]);
  });

  it('should use default patterns for targets with only eslintrc', () => {
    expect(
      eslintPluginConfigSchema.parse({ eslintrc: 'eslint.config.js' }),
    ).toStrictEqual([{ eslintrc: 'eslint.config.js', patterns: '.' }]);
  });
});
