import { describe, expect, it } from 'vitest';
import {
  artifactGenerationCommand,
  pluginArtifactOptionsSchema,
} from './configuration.js';

describe('artifactGenerationCommand', () => {
  it('should validate a command with required fields', () => {
    const data = { command: 'npx' };
    expect(artifactGenerationCommand.safeParse(data)).toStrictEqual({
      success: true,
      data: { command: 'npx' },
    });
  });

  it('should validate a command with args', () => {
    const data = { command: 'npx', args: ['eslint', 'src/'] };
    expect(artifactGenerationCommand.safeParse(data)).toStrictEqual({
      success: true,
      data: { command: 'npx', args: ['eslint', 'src/'] },
    });
  });

  it('should fail if command is missing', () => {
    const data = { args: ['eslint', 'src/'] };
    expect(artifactGenerationCommand.safeParse(data).success).toBe(false);
  });

  it('should fail if command is empty', () => {
    const data = { command: '' };
    expect(artifactGenerationCommand.safeParse(data).success).toBe(false);
  });

  it('should fail if args is not an array of strings', () => {
    const data = { command: 'npx', args: [123, true] };
    expect(artifactGenerationCommand.safeParse(data).success).toBe(false);
  });
});

describe('pluginArtifactOptionsSchema', () => {
  it('should validate with only artifactsPaths as string', () => {
    const data = { artifactsPaths: 'dist/report.json' };
    expect(pluginArtifactOptionsSchema.safeParse(data)).toStrictEqual({
      success: true,
      data: {
        artifactsPaths: 'dist/report.json',
      },
    });
  });

  it('should validate with artifactsPaths as array of strings', () => {
    const data = { artifactsPaths: ['dist/report.json', 'dist/summary.json'] };
    expect(pluginArtifactOptionsSchema.safeParse(data)).toStrictEqual({
      success: true,
      data: {
        artifactsPaths: ['dist/report.json', 'dist/summary.json'],
      },
    });
  });

  it('should fail if artifactsPaths is an empty array', () => {
    const data = { artifactsPaths: [] };
    expect(pluginArtifactOptionsSchema.safeParse(data).success).toBe(false);
  });

  it('should validate with generateArtifacts and artifactsPaths', () => {
    const data = {
      generateArtifacts: { command: 'npm', args: ['run', 'build'] },
      artifactsPaths: ['dist/report.json'],
    };
    expect(pluginArtifactOptionsSchema.safeParse(data)).toStrictEqual({
      success: true,
      data: {
        generateArtifacts: { command: 'npm', args: ['run', 'build'] },
        artifactsPaths: ['dist/report.json'],
      },
    });
  });

  it('should fail if artifactsPaths is missing', () => {
    const data = { generateArtifacts: { command: 'npm' } };
    expect(pluginArtifactOptionsSchema.safeParse(data).success).toBe(false);
  });

  it('should fail if artifactsPaths is not string or array of strings', () => {
    const data = { artifactsPaths: 123 };
    expect(pluginArtifactOptionsSchema.safeParse(data).success).toBe(false);
  });

  it('should fail if generateArtifacts is invalid', () => {
    const data = {
      generateArtifacts: { command: '' },
      artifactsPaths: 'dist/report.json',
    };
    expect(pluginArtifactOptionsSchema.safeParse(data).success).toBe(false);
  });

  it('should validate with generateArtifacts as a string', () => {
    const data = {
      generateArtifacts: 'yarn test --coverage',
      artifactsPaths: 'coverage/lcov.info',
    };
    expect(pluginArtifactOptionsSchema.safeParse(data)).toStrictEqual({
      success: true,
      data: {
        generateArtifacts: 'yarn test --coverage',
        artifactsPaths: 'coverage/lcov.info',
      },
    });
  });

  it('should fail if generateArtifacts is an empty string', () => {
    const data = {
      generateArtifacts: '',
      artifactsPaths: 'coverage/lcov.info',
    };
    expect(pluginArtifactOptionsSchema.safeParse(data).success).toBe(false);
  });

  it('should fail if generateArtifacts is a number', () => {
    const data = {
      generateArtifacts: 123,
      artifactsPaths: 'coverage/lcov.info',
    };
    expect(pluginArtifactOptionsSchema.safeParse(data).success).toBe(false);
  });
});
