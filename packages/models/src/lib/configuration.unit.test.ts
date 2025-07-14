import { describe, expect, it } from 'vitest';
import {
  artifactGenerationCommandSchema,
  pluginArtifactOptionsSchema,
} from './configuration.js';

describe('artifactGenerationCommandSchema', () => {
  it('should validate a command with required fields', () => {
    const data = { command: 'npx' };
    expect(artifactGenerationCommandSchema.safeParse(data)).toStrictEqual({
      success: true,
      data: { command: 'npx' },
    });
  });

  it('should validate a command with args', () => {
    const data = { command: 'npx', args: ['eslint', 'src/'] };
    expect(artifactGenerationCommandSchema.safeParse(data)).toStrictEqual({
      success: true,
      data: { command: 'npx', args: ['eslint', 'src/'] },
    });
  });

  it('should fail if command is missing', () => {
    const data = { args: ['eslint', 'src/'] };
    expect(artifactGenerationCommandSchema.safeParse(data).success).toBe(false);
  });

  it('should fail if command is empty', () => {
    const data = { command: '' };
    expect(artifactGenerationCommandSchema.safeParse(data).success).toBe(false);
  });

  it('should fail if args is not an array of strings', () => {
    const data = { command: 'npx', args: [123, true] };
    expect(artifactGenerationCommandSchema.safeParse(data).success).toBe(false);
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

  it('should validate with generateArtifactsCommand and artifactsPaths', () => {
    const data = {
      generateArtifactsCommand: { command: 'npm', args: ['run', 'build'] },
      artifactsPaths: ['dist/report.json'],
    };
    expect(pluginArtifactOptionsSchema.safeParse(data)).toStrictEqual({
      success: true,
      data: {
        generateArtifactsCommand: { command: 'npm', args: ['run', 'build'] },
        artifactsPaths: ['dist/report.json'],
      },
    });
  });

  it('should fail if artifactsPaths is missing', () => {
    const data = { generateArtifactsCommand: { command: 'npm' } };
    expect(pluginArtifactOptionsSchema.safeParse(data).success).toBe(false);
  });

  it('should fail if artifactsPaths is not string or array of strings', () => {
    const data = { artifactsPaths: 123 };
    expect(pluginArtifactOptionsSchema.safeParse(data).success).toBe(false);
  });

  it('should fail if generateArtifactsCommand is invalid', () => {
    const data = {
      generateArtifactsCommand: { command: '' },
      artifactsPaths: 'dist/report.json',
    };
    expect(pluginArtifactOptionsSchema.safeParse(data).success).toBe(false);
  });

  it('should validate with generateArtifactsCommand as a string', () => {
    const data = {
      generateArtifactsCommand: 'yarn test --coverage',
      artifactsPaths: 'coverage/lcov.info',
    };
    expect(pluginArtifactOptionsSchema.safeParse(data)).toStrictEqual({
      success: true,
      data: {
        generateArtifactsCommand: 'yarn test --coverage',
        artifactsPaths: 'coverage/lcov.info',
      },
    });
  });

  it('should fail if generateArtifactsCommand is an empty string', () => {
    const data = {
      generateArtifactsCommand: '',
      artifactsPaths: 'coverage/lcov.info',
    };
    expect(pluginArtifactOptionsSchema.safeParse(data).success).toBe(false);
  });

  it('should fail if generateArtifactsCommand is a number', () => {
    const data = {
      generateArtifactsCommand: 123,
      artifactsPaths: 'coverage/lcov.info',
    };
    expect(pluginArtifactOptionsSchema.safeParse(data).success).toBe(false);
  });
});
