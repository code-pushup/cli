import { type Tree, readJson } from '@nx/devkit';
import { dirname } from 'path';
import type { DiagnosticFormatter, FormatterOptions } from './formatter';
import { createTsconfigFormatter } from './formatter';

/* ============================== core types ============================== */

export type Diagnostic = {
  path: string;
  message: string;
  before?: unknown;
  after?: unknown;
};

/* ============================== typed config types ============================== */

export type TsConfigJson = {
  extends?: string;
  compilerOptions?: {
    outDir?: string;
    types?: string[];
    module?: string;
    strict?: boolean;
    target?: string;
    moduleResolution?: string;
    esModuleInterop?: boolean;
    allowSyntheticDefaultImports?: boolean;
    forceConsistentCasingInFileNames?: boolean;
    skipLibCheck?: boolean;
    declaration?: boolean;
    declarationMap?: boolean;
    sourceMap?: boolean;
    removeComments?: boolean;
    noEmit?: boolean;
    incremental?: boolean;
    tsBuildInfoFile?: string;
    jsx?: string;
    lib?: string[];
    baseUrl?: string;
    paths?: Record<string, string[]>;
    rootDir?: string;
    composite?: boolean;
    isolatedModules?: boolean;
    allowJs?: boolean;
    checkJs?: boolean;
    maxNodeModuleJsDepth?: number;
    noImplicitAny?: boolean;
    strictNullChecks?: boolean;
    strictFunctionTypes?: boolean;
    noImplicitReturns?: boolean;
    noFallthroughCasesInSwitch?: boolean;
    noUncheckedIndexedAccess?: boolean;
    noImplicitOverride?: boolean;
    allowUnusedLabels?: boolean;
    allowUnreachableCode?: boolean;
    exactOptionalPropertyTypes?: boolean;
    noImplicitThis?: boolean;
    useUnknownInCatchVariables?: boolean;
    alwaysStrict?: boolean;
    noUnusedLocals?: boolean;
    noUnusedParameters?: boolean;
    noImplicitUseStrict?: boolean;
    noPropertyAccessFromIndexSignature?: boolean;
    noUncheckedSideEffectImports?: boolean;
  };
  include?: string[];
  exclude?: string[];
  references?: Array<{ path: string }>;
  files?: string[];
};

export type JsonUpdate<T> =
  | T
  | {
      $set?: T;
      $add?: T extends (infer U)[] ? U[] : never;
      $remove?: T extends (infer U)[] ? U[] : never;
      $merge?: T extends object ? Partial<T> : never;
    };

export type TypedConfig<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? JsonUpdate<T[K]> | readonly U[]
    : T[K] extends object
      ? JsonUpdate<T[K]> | TypedConfig<T[K]>
      : JsonUpdate<T[K]>;
};

function normalizeConfig<T>(input: TypedConfig<T>): Updater<T> {
  return (obj: T, path: string) => {
    let result = { ...obj };
    const diagnostics: Diagnostic[] = [];

    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;

      const k = key as keyof T;
      const currentPath = path ? `${path}.${key}` : key;

      if (isJsonUpdate(value)) {
        // Handle explicit update operations
        const update = value as JsonUpdate<any>;

        if ('$set' in update && update.$set !== undefined) {
          if (result[k] !== update.$set) {
            diagnostics.push({
              path: currentPath,
              message: result[k] === undefined ? 'added' : 'updated',
              before: result[k],
              after: update.$set,
            });
            result = { ...result, [k]: update.$set };
          }
        }

        if (
          '$add' in update &&
          update.$add !== undefined &&
          Array.isArray(update.$add)
        ) {
          const updater = arr.add(...update.$add);
          const res = updater(result[k] as any[], currentPath);
          result = { ...result, [k]: res.value };
          diagnostics.push(...res.diagnostics);
        }

        if (
          '$remove' in update &&
          update.$remove !== undefined &&
          Array.isArray(update.$remove)
        ) {
          const updater = arr.remove(...update.$remove);
          const res = updater(result[k] as any[], currentPath);
          result = { ...result, [k]: res.value };
          diagnostics.push(...res.diagnostics);
        }

        if (
          '$merge' in update &&
          update.$merge !== undefined &&
          typeof update.$merge === 'object'
        ) {
          // Merge the object
          const current = (result[k] as Record<string, unknown>) || {};
          const merged = { ...current, ...update.$merge };
          if (JSON.stringify(current) !== JSON.stringify(merged)) {
            diagnostics.push({
              path: currentPath,
              message: 'updated',
              before: current,
              after: merged,
            });
            result = { ...result, [k]: merged };
          }
        }
      } else if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Nested object - recurse
        const nestedUpdater = normalizeConfig(value as TypedConfig<any>);
        const res = nestedUpdater(result[k] as any, currentPath);
        result = { ...result, [k]: res.value };
        diagnostics.push(...res.diagnostics);
      } else {
        // Plain value - apply default behavior
        if (Array.isArray(value)) {
          // Array -> $set
          if (JSON.stringify(result[k]) !== JSON.stringify(value)) {
            diagnostics.push({
              path: currentPath,
              message: result[k] === undefined ? 'added' : 'updated',
              before: result[k],
              after: value,
            });
            result = { ...result, [k]: value };
          }
        } else if (typeof value === 'object' && value !== null) {
          // Object -> $merge
          const current =
            result[k] &&
            typeof result[k] === 'object' &&
            !Array.isArray(result[k])
              ? (result[k] as Record<string, unknown>)
              : {};
          const merged = { ...current, ...(value as Record<string, unknown>) };
          if (JSON.stringify(current) !== JSON.stringify(merged)) {
            diagnostics.push({
              path: currentPath,
              message: 'updated',
              before: current,
              after: merged,
            });
            result = { ...result, [k]: merged };
          }
        } else {
          // Scalar -> $set
          if (result[k] !== value) {
            diagnostics.push({
              path: currentPath,
              message: result[k] === undefined ? 'added' : 'updated',
              before: result[k],
              after: value,
            });
            result = { ...result, [k]: value };
          }
        }
      }
    }

    return { value: result, diagnostics };
  };
}

function isJsonUpdate(value: any): value is JsonUpdate<any> {
  return (
    value &&
    typeof value === 'object' &&
    ('$set' in value ||
      '$add' in value ||
      '$remove' in value ||
      '$merge' in value)
  );
}

export type UpdateResult<T> = {
  value: T;
  diagnostics: Diagnostic[];
};

export type Updater<T> = (v: T, path: string) => UpdateResult<T>;
export type Value<T> = T | ((current: T) => T);

/* ============================== composition ============================== */

export const pipe =
  <T>(...fns: Updater<T>[]): Updater<T> =>
  (v, path) =>
    fns.reduce(
      (acc, fn) => {
        const next = fn(acc.value, path);
        return {
          value: next.value,
          diagnostics: [...acc.diagnostics, ...next.diagnostics],
        };
      },
      { value: v, diagnostics: [] as Diagnostic[] },
    );

/* ============================== object ops ============================== */

type Obj = Record<string, unknown>;

export const obj = {
  add:
    (props: Record<string, Value<any>>): Updater<Obj> =>
    (v = {}, path) => {
      const diagnostics: Diagnostic[] = [];
      const next = { ...v };

      for (const [k, val] of Object.entries(props)) {
        const prev = v[k];
        const resolved = typeof val === 'function' ? (val as any)(prev) : val;

        if (prev !== resolved) {
          diagnostics.push({
            path: `${path}.${k}`,
            message: prev === undefined ? 'added' : 'updated',
            before: prev,
            after: resolved,
          });
        }

        next[k] = resolved;
      }

      return { value: next, diagnostics };
    },

  remove:
    (...keys: string[]): Updater<Obj> =>
    (v = {}, path) => {
      const diagnostics: Diagnostic[] = [];
      const next = { ...v };

      for (const k of keys) {
        if (k in next) {
          diagnostics.push({
            path: `${path}.${k}`,
            message: 'removed',
            before: next[k],
          });
          delete next[k];
        }
      }

      return { value: next, diagnostics };
    },

  pipe: (...fns: Updater<Obj>[]) => pipe(...fns),
};

/* ============================== array ops =============================== */

export const arr = {
  add:
    (...items: string[]): Updater<string[]> =>
    (v = [], path) => {
      const diagnostics: Diagnostic[] = [];
      const set = new Set(v);

      for (const item of items) {
        if (!set.has(item)) {
          diagnostics.push({
            path,
            message: 'added',
            after: item,
          });
          set.add(item);
        }
      }

      return { value: [...set], diagnostics };
    },

  remove:
    (...items: string[]): Updater<string[]> =>
    (v = [], path) => {
      const diagnostics: Diagnostic[] = [];
      const next = v.filter(x => {
        if (items.includes(x)) {
          diagnostics.push({
            path,
            message: 'removed',
            before: x,
          });
          return false;
        }
        return true;
      });

      return { value: next, diagnostics };
    },

  pipe: (...fns: Updater<string[]>[]) => pipe(...fns),
};

type TsConfigFileName<B extends string = string> =
  | 'tsconfig.json'
  | `tsconfig.${B}.json`;

export type SyncResult = {
  diagnostics: Diagnostic[];
  matchedFile?: string; // The actual file path that was matched
  renamedFrom?: string; // The original file path that was renamed (if rename occurred)
};

export type TsBase = {
  sync(tree: Tree): Diagnostic[] | SyncResult;
  tags?: string[];
  formatter?: DiagnosticFormatter;
  filePath?: string; // The file pattern this baseline targets (e.g., 'tsconfig.lib.json')
};

// Re-export formatter types for convenience
export type { DiagnosticFormatter, FormatterOptions } from './formatter';
export { createTsconfigFormatter } from './formatter';

// Helper to create a simple value updater
const value =
  <T>(target: T): Updater<T> =>
  (v, path) => {
    if (v !== target) {
      return {
        value: target,
        diagnostics: [
          {
            path,
            message: v === undefined ? 'added' : 'updated',
            before: v,
            after: target,
          },
        ],
      };
    }
    return { value: v, diagnostics: [] };
  };

/**
 * Resolves a path relative to repo root to a path relative to the tsconfig file location.
 * Calculates the correct relative path based on the depth of the tsconfig file.
 *
 * @param repoRootPath - Path relative to repo root (e.g., 'testing/test-setup/src/vitest.d.ts')
 * @param tsconfigPath - Path to the tsconfig.json file (e.g., 'packages/my-package/tsconfig.test.json')
 * @returns Path relative to tsconfig location (e.g., '../../testing/test-setup/src/vitest.d.ts')
 */
export const resolveRepoRootPath = (
  repoRootPath: string,
  tsconfigPath: string,
): string => {
  const tsconfigDir = dirname(tsconfigPath);

  // Count depth: how many directory levels deep is the tsconfig?
  // e.g., 'packages/my-package/tsconfig.test.json' -> depth 2
  const depth = tsconfigDir.split('/').filter(Boolean).length;

  // Build relative path: go up 'depth' levels, then to repo root path
  const upPath = '../'.repeat(depth) + repoRootPath;

  return upPath;
};

// Keep the type simple - just Updater<string[]>
// Repo paths are resolved automatically in the apply function
export type IncludeExcludeUpdater = Updater<string[]>;

export const createTsconfigBase = (
  fileMatcherOrArray: TsConfigFileName | TsConfigFileName[],
  base: {
    tags?: string[];
    renameFrom?: string | string[]; // File patterns to match for renaming (e.g., 'tsconfig.spec.json')
    extends?: Updater<string | undefined> | string;
    enforceExtends?: boolean; // If false, extends will not be enforced even if provided
    compilerOptions?: Updater<Record<string, unknown>>;
    include?: IncludeExcludeUpdater;
    enforceInclude?: boolean; // If false, include will not be enforced even if provided
    exclude?: IncludeExcludeUpdater;
    enforceExclude?: boolean; // If false, exclude will not be enforced even if provided
    formatter?: DiagnosticFormatter | FormatterOptions;
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

  // Determine filePath for header messages
  const filePath = Array.isArray(fileMatcherOrArray)
    ? fileMatcherOrArray[0]
    : fileMatcherOrArray;

  // Handle formatter - can be a DiagnosticFormatter or FormatterOptions
  let formatter: DiagnosticFormatter | undefined;
  if (base.formatter) {
    if ('format' in base.formatter) {
      // It's already a DiagnosticFormatter
      formatter = base.formatter;
    } else {
      // It's FormatterOptions, create a formatter
      formatter = createTsconfigFormatter(base.formatter);
    }
  } else {
    // Default formatter
    formatter = createTsconfigFormatter();
  }

  return {
    tags: base.tags,
    formatter,
    filePath,
    sync(tree) {
      const diagnostics: Diagnostic[] = [];
      let path: string | null = null;
      let renamedFrom: string | undefined = undefined;

      const find = (p: string | string[]) =>
        (Array.isArray(p) ? p : [p]).find(f => tree.exists(f)) ?? null;

      // Determine target filename (first item if array)
      const targetFileName: string = Array.isArray(fileMatcherOrArray)
        ? fileMatcherOrArray[0]!
        : fileMatcherOrArray;

      // Check for renameFrom patterns first
      if (base.renameFrom) {
        const renameFromPatterns = Array.isArray(base.renameFrom)
          ? base.renameFrom
          : [base.renameFrom];

        const renameMatch = base.renameFrom && find(base.renameFrom);

        if (renameMatch) {
          // Read the file content
          const fileContent = tree.read(renameMatch);
          if (fileContent) {
            // Write to target filename (overwrites if exists)
            tree.write(targetFileName, fileContent);
            // Delete the original file
            tree.delete(renameMatch);
            // Set path to target and track rename
            path = targetFileName;
            renamedFrom = renameMatch;
          }
        }
      }

      // If no rename occurred, check for target fileMatcher
      if (!path) {
        path = find(fileMatcher);

        if (!path) {
          // No matching file found, skip this baseline
          return diagnostics;
        }
      }

      const current = readJson(tree, path);

      const apply = (updater: any, currentValue: any, jsonPath: string) => {
        if (!updater) return currentValue;
        // Handle plain string values for extends field (only when T is string)
        if (typeof updater === 'string' && typeof currentValue === 'string') {
          const stringUpdater = value(updater);
          const res = stringUpdater(currentValue, jsonPath);
          diagnostics.push(...res.diagnostics);
          return res.value;
        }
        const res = updater(currentValue, jsonPath);
        diagnostics.push(...res.diagnostics);

        // Post-process arrays to resolve repo: paths
        if (Array.isArray(res.value)) {
          return res.value.map((v: any) =>
            typeof v === 'string' && v.startsWith('repo:')
              ? resolveRepoRootPath(v.slice(5), path)
              : v,
          );
        }

        return res.value;
      };

      const next: Record<string, unknown> = {
        ...current,
        extends:
          base.enforceExtends !== false && base.extends !== undefined
            ? apply(
                base.extends as
                  | Updater<string | undefined>
                  | string
                  | undefined,
                current.extends,
                'extends',
              )
            : current.extends,
        compilerOptions: apply(
          base.compilerOptions,
          current.compilerOptions ?? {},
          'compilerOptions',
        ),
      };

      // Only add include/exclude if they should be enforced, otherwise keep existing value or omit
      if (base.enforceInclude !== false && base.include !== undefined) {
        next.include = apply(base.include, current.include ?? [], 'include');
      } else if ('include' in current) {
        // Keep existing include if not enforcing and it exists
        next.include = current.include;
      } else {
        // Remove include if not enforcing and it doesn't exist
        delete next.include;
      }

      if (base.enforceExclude !== false && base.exclude !== undefined) {
        next.exclude = apply(base.exclude, current.exclude ?? [], 'exclude');
      } else if ('exclude' in current) {
        // Keep existing exclude if not enforcing and it exists
        next.exclude = current.exclude;
      } else {
        // Remove exclude if not enforcing and it doesn't exist
        delete next.exclude;
      }

      if (diagnostics.length > 0) {
        tree.write(path, JSON.stringify(next, null, 2));
      }

      return {
        diagnostics,
        matchedFile: path,
        renamedFrom,
      };
    },
  };
};

/**
 * Generic version of createTsconfigBase that accepts typed configuration.
 * Provides strong typing and inferred updaters from plain values.
 */
export const createTsconfigBaseTyped = <T extends TsConfigJson = TsConfigJson>(
  fileMatcherOrArray: TsConfigFileName | TsConfigFileName[],
  base: {
    tags?: string[];
    renameFrom?: string | string[];
    config: TypedConfig<T>;
    enforceExtends?: boolean;
    enforceInclude?: boolean;
    enforceExclude?: boolean;
    formatter?: DiagnosticFormatter | FormatterOptions;
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

  // Determine filePath for header messages
  const filePath = Array.isArray(fileMatcherOrArray)
    ? fileMatcherOrArray[0]
    : fileMatcherOrArray;

  // Handle formatter - can be a DiagnosticFormatter or FormatterOptions
  let formatter: DiagnosticFormatter | undefined;
  if (base.formatter) {
    if ('format' in base.formatter) {
      // It's already a DiagnosticFormatter
      formatter = base.formatter;
    } else {
      // It's FormatterOptions, create a formatter
      formatter = createTsconfigFormatter(base.formatter);
    }
  } else {
    // Default formatter
    formatter = createTsconfigFormatter();
  }

  return {
    tags: base.tags,
    formatter,
    filePath,
    sync(tree) {
      const diagnostics: Diagnostic[] = [];
      let path: string | null = null;
      let renamedFrom: string | undefined = undefined;

      const find = (p: string | string[]) =>
        (Array.isArray(p) ? p : [p]).find(f => tree.exists(f)) ?? null;

      // Determine target filename (first item if array)
      const targetFileName: string = Array.isArray(fileMatcherOrArray)
        ? fileMatcherOrArray[0]!
        : fileMatcherOrArray;

      // Check for renameFrom patterns first
      if (base.renameFrom) {
        const renameFromPatterns = Array.isArray(base.renameFrom)
          ? base.renameFrom
          : [base.renameFrom];

        const renameMatch = base.renameFrom && find(base.renameFrom);

        if (renameMatch) {
          // Read the file content
          const fileContent = tree.read(renameMatch);
          if (fileContent) {
            // Write to target filename (overwrites if exists)
            tree.write(targetFileName, fileContent);
            // Delete the original file
            tree.delete(renameMatch);
            // Set path to target and track rename
            path = targetFileName;
            renamedFrom = renameMatch;
          }
        }
      }

      // If no rename occurred, check for target fileMatcher
      if (!path) {
        path = find(fileMatcher);

        if (!path) {
          // No matching file found, skip this baseline
          return diagnostics;
        }
      }

      const current = readJson(tree, path);

      // Apply the typed config using normalizeConfig
      const normalizedUpdater = normalizeConfig(base.config);
      const result = normalizedUpdater(current, '');

      diagnostics.push(...result.diagnostics);

      // Post-process arrays to resolve repo: paths
      const finalValue = { ...result.value };
      if (Array.isArray(finalValue.include)) {
        finalValue.include = finalValue.include.map((v: any) =>
          typeof v === 'string' && v.startsWith('repo:')
            ? resolveRepoRootPath(v.slice(5), path)
            : v,
        );
      }
      if (Array.isArray(finalValue.exclude)) {
        finalValue.exclude = finalValue.exclude.map((v: any) =>
          typeof v === 'string' && v.startsWith('repo:')
            ? resolveRepoRootPath(v.slice(5), path)
            : v,
        );
      }

      if (diagnostics.length > 0) {
        tree.write(path, JSON.stringify(finalValue, null, 2));
      }

      return {
        diagnostics,
        matchedFile: path,
        renamedFrom,
      };
    },
  };
};
