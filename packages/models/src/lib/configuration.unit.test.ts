import { describe, expect, it } from 'vitest';
import {
  artifactGenerationCommand,
  pluginArtefactOptionsSchema,
} from './configuration.js';

describe('artifactGenerationCommand', () => {
  it('should validate a command with required fields', () => {
    const data = { command: 'npx' };
    const result = artifactGenerationCommand.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.command).toBe('npx');
      expect(result.data.args).toBeUndefined();
    }
  });

  it('should validate a command with args', () => {
    const data = { command: 'npx', args: ['eslint', 'src/'] };
    const result = artifactGenerationCommand.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.command).toBe('npx');
      expect(result.data.args).toEqual(['eslint', 'src/']);
    }
  });

  it('should fail if command is missing', () => {
    const data = { args: ['eslint', 'src/'] };
    const result = artifactGenerationCommand.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should fail if command is empty', () => {
    const data = { command: '' };
    const result = artifactGenerationCommand.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should fail if args is not an array of strings', () => {
    const data = { command: 'npx', args: [123, true] };
    const result = artifactGenerationCommand.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('pluginArtefactOptionsSchema', () => {
  it('should validate with only artefactsPaths as string', () => {
    const data = { artefactsPaths: 'dist/report.json' };
    const { success } = pluginArtefactOptionsSchema.safeParse(data);
    expect(success).toBe(true);
  });

  it('should validate with artefactsPaths as array of strings', () => {
    const data = { artefactsPaths: ['dist/report.json', 'dist/summary.json'] };
    const { success } = pluginArtefactOptionsSchema.safeParse(data);
    expect(success).toBe(true);
  });

  it('should fail if artefactsPaths is an empty array', () => {
    const data = { artefactsPaths: [] };
    const { success } = pluginArtefactOptionsSchema.safeParse(data);
    expect(success).toBe(false);
  });

  it('should validate with generateArtefacts and artefactsPaths', () => {
    const data = {
      generateArtefacts: { command: 'npm', args: ['run', 'build'] },
      artefactsPaths: ['dist/report.json'],
    };
    const { success } = pluginArtefactOptionsSchema.safeParse(data);
    expect(success).toBe(true);
  });

  it('should fail if artefactsPaths is missing', () => {
    const data = { generateArtefacts: { command: 'npm' } };
    const { success } = pluginArtefactOptionsSchema.safeParse(data);
    expect(success).toBe(false);
  });

  it('should fail if artefactsPaths is not string or array of strings', () => {
    const data = { artefactsPaths: 123 };
    const { success } = pluginArtefactOptionsSchema.safeParse(data);
    expect(success).toBe(false);
  });

  it('should fail if generateArtefacts is invalid', () => {
    const data = {
      generateArtefacts: { command: '' },
      artefactsPaths: 'dist/report.json',
    };
    const { success } = pluginArtefactOptionsSchema.safeParse(data);
    expect(success).toBe(false);
  });
});
