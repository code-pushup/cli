import { describe, expect, it } from 'vitest';
import {
  artifactGenerationCommand,
  pluginArtefactOptionsSchema,
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

describe('pluginArtefactOptionsSchema', () => {
  it('should validate with only artefactsPaths as string', () => {
    const data = { artefactsPaths: 'dist/report.json' };
    expect(pluginArtefactOptionsSchema.safeParse(data)).toStrictEqual({
      success: true,
      data: {
        artefactsPaths: 'dist/report.json',
      },
    });
  });

  it('should validate with artefactsPaths as array of strings', () => {
    const data = { artefactsPaths: ['dist/report.json', 'dist/summary.json'] };
    expect(pluginArtefactOptionsSchema.safeParse(data)).toStrictEqual({
      success: true,
      data: {
        artefactsPaths: ['dist/report.json', 'dist/summary.json'],
      },
    });
  });

  it('should fail if artefactsPaths is an empty array', () => {
    const data = { artefactsPaths: [] };
    expect(pluginArtefactOptionsSchema.safeParse(data).success).toBe(false);
  });

  it('should validate with generateArtefacts and artefactsPaths', () => {
    const data = {
      generateArtefacts: { command: 'npm', args: ['run', 'build'] },
      artefactsPaths: ['dist/report.json'],
    };
    expect(pluginArtefactOptionsSchema.safeParse(data)).toStrictEqual({
      success: true,
      data: {
        generateArtefacts: { command: 'npm', args: ['run', 'build'] },
        artefactsPaths: ['dist/report.json'],
      },
    });
  });

  it('should fail if artefactsPaths is missing', () => {
    const data = { generateArtefacts: { command: 'npm' } };
    expect(pluginArtefactOptionsSchema.safeParse(data).success).toBe(false);
  });

  it('should fail if artefactsPaths is not string or array of strings', () => {
    const data = { artefactsPaths: 123 };
    expect(pluginArtefactOptionsSchema.safeParse(data).success).toBe(false);
  });

  it('should fail if generateArtefacts is invalid', () => {
    const data = {
      generateArtefacts: { command: '' },
      artefactsPaths: 'dist/report.json',
    };
    expect(pluginArtefactOptionsSchema.safeParse(data).success).toBe(false);
  });
});
