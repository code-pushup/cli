import type * as devKit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import {
  createTsconfigBase,
  diagnosticsToMessage,
  readFirstMatchingFile,
} from './baseline.tsconfig.js';
import type { Diagnostic } from './json-updater.js';
import { arr, obj } from './json-updater.js';

describe('readFirstMatchingFile', () => {
  let tree: devKit.Tree;
  const testProjectName = 'test-app';
  const tsconfigLibPath = path.join(testProjectName, 'tsconfig.lib.json');
  const tsconfigPath = path.join(testProjectName, 'tsconfig.json');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should find first matching file', () => {
    tree.write(tsconfigLibPath, JSON.stringify({}));
    tree.write(tsconfigPath, JSON.stringify({}));

    const result = readFirstMatchingFile(
      tree,
      ['tsconfig.lib.json', 'tsconfig.json'],
      {
        read: (_, p) => p,
      },
    );

    expect(result).toBe(tsconfigLibPath);
  });

  it('should throw if no file matches', () => {
    expect(() =>
      readFirstMatchingFile(tree, ['tsconfig.lib.json', 'tsconfig.json'], {
        read: (_, p) => p,
      }),
    ).toThrow('No file matched: tsconfig.lib.json, tsconfig.json');
  });
});

describe('diagnosticsToMessage', () => {
  it('should return empty string for empty diagnostics', () => {
    expect(diagnosticsToMessage([], 'tsconfig.lib.json')).toBe('');
  });

  it('should format added diagnostics', () => {
    const diagnostics: Diagnostic[] = [
      {
        path: 'compilerOptions.strict',
        message: 'added',
        after: true,
      },
    ];

    expect(diagnosticsToMessage(diagnostics, 'tsconfig.lib.json')).toBe(
      'tsconfig out of sync: tsconfig.lib.json\n\n• compilerOptions.strict: + true',
    );
  });

  it('should format removed diagnostics', () => {
    const diagnostics: Diagnostic[] = [
      {
        path: 'compilerOptions.noEmit',
        message: 'removed',
        before: false,
      },
    ];

    expect(diagnosticsToMessage(diagnostics, 'tsconfig.lib.json')).toBe(
      'tsconfig out of sync: tsconfig.lib.json\n\n• compilerOptions.noEmit: - false',
    );
  });

  it('should format updated diagnostics', () => {
    const diagnostics: Diagnostic[] = [
      {
        path: 'extends',
        message: 'updated',
        before: './tsconfig.json',
        after: './tsconfig.base.json',
      },
    ];

    expect(diagnosticsToMessage(diagnostics, 'tsconfig.lib.json')).toBe(
      'tsconfig out of sync: tsconfig.lib.json\n\n• extends: "./tsconfig.json" → "./tsconfig.base.json"',
    );
  });

  it('should format multiple diagnostics', () => {
    const diagnostics: Diagnostic[] = [
      {
        path: 'compilerOptions.strict',
        message: 'added',
        after: true,
      },
      {
        path: 'include',
        message: 'added',
        after: 'src/**/*.ts',
      },
    ];

    expect(diagnosticsToMessage(diagnostics, 'tsconfig.lib.json')).toBe(
      'tsconfig out of sync: tsconfig.lib.json\n\n• compilerOptions.strict: + true\n• include: + "src/**/*.ts"',
    );
  });
});

describe('createTsconfigBase', () => {
  let tree: devKit.Tree;
  const testProjectName = 'test-app';
  const tsconfigLibPath = path.join(testProjectName, 'tsconfig.lib.json');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(
      tsconfigLibPath,
      JSON.stringify({
        compilerOptions: {},
      }),
    );
  });

  it('should sync tsconfig with added properties', () => {
    const tsconfigBase = createTsconfigBase('tsconfig.lib.json', {
      extends: './tsconfig.base.json',
      compilerOptions: obj.add({
        strict: true,
        noEmit: true,
      }),
      include: arr.add(['src/**/*.ts']),
      exclude: arr.add(['node_modules', 'dist']),
    });

    const diagnostics = tsconfigBase.sync(tree);

    const config = JSON.parse(tree.read(tsconfigLibPath)?.toString() ?? '{}');
    expect(config).toStrictEqual({
      extends: './tsconfig.base.json',
      compilerOptions: {
        strict: true,
        noEmit: true,
      },
      include: ['src/**/*.ts'],
      exclude: ['node_modules', 'dist'],
    });

    expect(diagnostics.length).toBeGreaterThan(0);
    const message = diagnosticsToMessage(diagnostics, 'tsconfig.lib.json');
    expect(message).toContain('tsconfig out of sync');
  });

  it('should not modify tsconfig if already in sync', () => {
    tree.write(
      tsconfigLibPath,
      JSON.stringify({
        extends: './tsconfig.base.json',
        compilerOptions: {
          strict: true,
          noEmit: true,
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules', 'dist'],
      }),
    );

    const tsconfigBase = createTsconfigBase('tsconfig.lib.json', {
      extends: './tsconfig.base.json',
      compilerOptions: obj.add({
        strict: true,
        noEmit: true,
      }),
      include: arr.add(['src/**/*.ts']),
      exclude: arr.add(['node_modules', 'dist']),
    });

    const diagnostics = tsconfigBase.sync(tree);

    expect(diagnostics).toHaveLength(0);
  });

  it('should handle missing tsconfig.json', () => {
    tree.delete(tsconfigLibPath);

    const tsconfigBase = createTsconfigBase(
      ['tsconfig.lib.json', 'tsconfig.json'],
      {
        extends: './tsconfig.base.json',
      },
    );

    expect(() => tsconfigBase.sync(tree)).toThrow();
  });
});
