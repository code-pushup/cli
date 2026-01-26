import { type Tree, readJson, updateJson } from '@nx/devkit';
import glob from 'glob';
import type { Diagnostic, Updater } from './json-updater.js';

type ReadFirstMatchOptions<T> = {
  read: (tree: Tree, path: string) => T;
};

const toArray = <T>(v: T | T[]) => (Array.isArray(v) ? v : [v]);

export const readFirstMatchingFile = <T>(
  tree: Tree,
  globMatcher: string | string[],
  { read }: ReadFirstMatchOptions<T>,
): T => {
  const patterns = toArray(globMatcher);

  const match = patterns
    .flatMap(p => glob.sync(p, { nodir: true }))
    .find(p => tree.exists(p));

  if (!match) {
    throw new Error(`No file matched: ${patterns.join(', ')}`);
  }

  return read(tree, match);
};

type TsConfigFileName<B extends string = string> =
  | 'tsconfig.json'
  | `tsconfig.${B}.json`;

type TsBase = {
  sync(tree: Tree): {
    outOfSyncMessage: string;
  };
};

export const diagnosticsToMessage = (
  diagnostics: Diagnostic[],
  filePath: string,
): string => {
  if (diagnostics.length === 0) {
    return '';
  }

  const lines = diagnostics.map(d => {
    const change =
      d.message === 'added'
        ? `+ ${JSON.stringify(d.after)}`
        : d.message === 'removed'
          ? `- ${JSON.stringify(d.before)}`
          : `${JSON.stringify(d.before)} → ${JSON.stringify(d.after)}`;

    return `• ${d.path}: ${change}`;
  });

  return [`tsconfig out of sync: ${filePath}`, '', ...lines].join('\n');
};

export const createTsconfigBase = (
  fileMatcherOrArray: TsConfigFileName | TsConfigFileName[],
  base: {
    extends?: Updater<string | undefined>;
    compilerOptions?: Updater<Record<string, unknown>>;
    include?: Updater<string[]>;
    exclude?: Updater<string[]>;
  },
): TsBase => {
  const fileMatcher: TsConfigFileName[] = Array.from(
    new Set([
      ...(Array.isArray(fileMatcherOrArray)
        ? fileMatcherOrArray
        : [fileMatcherOrArray]),
      'tsconfig.json',
    ]),
  );

  return {
    sync(tree) {
      const diagnostics: Diagnostic[] = [];

      const path = readFirstMatchingFile(tree, fileMatcher, {
        read: (_, p) => p,
      });

      const current = readJson(tree, path);

      const apply = <T>(
        updater: Updater<T> | undefined,
        value: T,
        jsonPath: string,
      ): T => {
        if (!updater) return value;
        const res = updater(value, jsonPath);
        diagnostics.push(...res.diagnostics);
        return res.value;
      };

      const next = {
        ...current,
        extends: apply(base.extends, current.extends, 'extends'),
        compilerOptions: apply(
          base.compilerOptions,
          current.compilerOptions ?? {},
          'compilerOptions',
        ),
        include: apply(base.include, current.include ?? [], 'include'),
        exclude: apply(base.exclude, current.exclude ?? [], 'exclude'),
      };

      if (diagnostics.length > 0) {
        updateJson(tree, path, next);
      }

      return {
        outOfSyncMessage: diagnosticsToMessage(diagnostics, path),
      };
    },
  };
};
