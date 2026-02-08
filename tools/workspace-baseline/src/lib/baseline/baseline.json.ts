import { type Tree, readJson } from '@nx/devkit';
import {
  findMatchingFile,
  pathSubstitutions,
  substitutePathsInArray,
} from './utils';

export type Diagnostic = {
  path: string;
  line?: number;
  column?: number;
  message: string;
  before?: unknown;
  after?: unknown;
};

const MUTATION_SYMBOL = Symbol('mutation');
const UNSET_SYMBOL = Symbol('unset');

type MutationKind = 'object' | 'array';

type BaseMutation<T> = {
  readonly [MUTATION_SYMBOL]: true;
  readonly kind: MutationKind;
  readonly __updater: Updater<T>;
};

export type ObjectMutation<T extends object> = BaseMutation<T> & {
  kind: 'object';
  set(values: Partial<T>): ObjectMutation<T>;
  remove(...keys: (keyof T)[]): ObjectMutation<T>;
};

export type ArrayMutation<T> = BaseMutation<T[]> & {
  kind: 'array';
  add(...items: T[]): ArrayMutation<T>;
  remove(...items: T[]): ArrayMutation<T>;
};

export type UnsetMarker = { [UNSET_SYMBOL]: true };

export type RootBuilder<T> = {
  set(values: {
    [K in keyof T]?:
      | T[K]
      | (NonNullable<T[K]> extends (infer U)[] ? ArrayMutation<U> : never)
      | (NonNullable<T[K]> extends object
          ? NonNullable<T[K]> extends any[]
            ? never
            : ObjectMutation<NonNullable<T[K]>>
          : never)
      | UnsetMarker;
  }): void;
  readonly __updater: Updater<T>;
};

const matchMutation = <R>(
  v: unknown,
  handlers: {
    array?: (m: ArrayMutation<any>) => R;
    object?: (m: ObjectMutation<any>) => R;
  },
): R | undefined => {
  if (
    typeof v !== 'object' ||
    v === null ||
    !(MUTATION_SYMBOL in v) ||
    (v as any)[MUTATION_SYMBOL] !== true
  ) {
    return;
  }

  const m = v as ObjectMutation<any> | ArrayMutation<any>;
  return m.kind === 'array' ? handlers.array?.(m) : handlers.object?.(m);
};

function isUnsetMarker(value: unknown): value is { [UNSET_SYMBOL]: true } {
  return (
    typeof value === 'object' &&
    value !== null &&
    UNSET_SYMBOL in value &&
    (value as any)[UNSET_SYMBOL] === true
  );
}

function baseMutation<T, K extends MutationKind>(
  kind: K,
  updater: Updater<T>,
  extend: (u: Updater<T>) => any,
) {
  return {
    kind,
    [MUTATION_SYMBOL]: true as const,
    __updater: updater,
    ...extend(updater),
  };
}

function createObjectMutation<T extends object>(
  updater: Updater<T>,
): ObjectMutation<T> {
  return baseMutation('object', updater, u => ({
    set: (values: Partial<T>) =>
      createObjectMutation(pipe(u, objUpdater.add(values))),
    remove: (...keys: (keyof T)[]) =>
      createObjectMutation(pipe(u, objUpdater.remove(...keys))),
  }));
}

function createArrayMutation<T>(updater: Updater<T[]>): ArrayMutation<T> {
  return baseMutation('array', updater, u => ({
    add: (...items: T[]) =>
      createArrayMutation(pipe(u, arrUpdater.add(...items))),
    remove: (...items: T[]) =>
      createArrayMutation(pipe(u, arrUpdater.remove(...items))),
  }));
}

const createBaseUpdater =
  <T>(empty: T): Updater<T> =>
  (v = empty) => ({ value: v, diagnostics: [] });

export function object<T extends object>(
  fn: (builder: ObjectMutation<T>) => void | ObjectMutation<T>,
): ObjectMutation<T> {
  const m = createObjectMutation(createBaseUpdater({} as T));
  return fn(m) || m;
}

// Add static methods to object function
object.add = <T extends object>(values: Partial<T>): ObjectMutation<T> => {
  return createObjectMutation(
    pipe(createBaseUpdater({} as T), objUpdater.add(values)),
  );
};

object.remove = <T extends object>(...keys: (keyof T)[]): ObjectMutation<T> => {
  return createObjectMutation(
    pipe(createBaseUpdater({} as T), objUpdater.remove(...keys)),
  );
};

export function array<T>(
  fn: (builder: ArrayMutation<T>) => void | ArrayMutation<T>,
): ArrayMutation<T>;
export function array(
  fn: (builder: ArrayMutation<string>) => void | ArrayMutation<string>,
): ArrayMutation<string>;
export function array<T = string>(
  fn: (builder: ArrayMutation<T>) => void | ArrayMutation<T>,
): ArrayMutation<T> {
  const m = createArrayMutation(createBaseUpdater([] as T[]));
  return fn(m) || m;
}

// Add static methods to array function
array.add = <T>(...items: T[]): ArrayMutation<T> => {
  return createArrayMutation(
    pipe(createBaseUpdater([] as T[]), arrUpdater.add(...items)),
  );
};

array.remove = <T>(...items: T[]): ArrayMutation<T> => {
  return createArrayMutation(
    pipe(createBaseUpdater([] as T[]), arrUpdater.remove(...items)),
  );
};

export const obj = object;
export const arr = array;

export function unset(): { [UNSET_SYMBOL]: true } {
  return { [UNSET_SYMBOL]: true as const };
}

export function createRootBuilder<T>(): RootBuilder<T> {
  const updaters: Updater<T>[] = [];

  const builder: RootBuilder<T> = {
    set(values: Parameters<RootBuilder<T>['set']>[0]): void {
      const updater: Updater<T> = (obj: T, path: string) => {
        let result = { ...(obj as Record<string, unknown>) } as T;
        const diagnostics: Diagnostic[] = [];

        Object.entries(values).forEach(([key, value]) => {
          if (value === undefined) return;

          const k = key as keyof T;
          const currentPath = path ? `${path}.${key}` : key;

          if (isUnsetMarker(value)) {
            const resultRecord = result as Record<string, unknown>;
            if (key in resultRecord) {
              diagnostics.push({
                path: currentPath,
                message: 'removed',
                before: resultRecord[key],
              });
              const { [key]: _, ...rest } = resultRecord;
              result = rest as T;
            }
            return;
          }

          const handled = matchMutation(value, {
            array: m => {
              const res = m.__updater((result[k] ?? []) as any[], currentPath);
              result = { ...result, [k]: res.value };
              diagnostics.push(...res.diagnostics);
            },
            object: m => {
              const res = m.__updater((result[k] ?? {}) as any, currentPath);
              result = { ...result, [k]: res.value };
              diagnostics.push(...res.diagnostics);
            },
          });

          if (handled !== undefined) return;

          // Skip mutation objects - they should have been handled above
          if (
            typeof value === 'object' &&
            value !== null &&
            MUTATION_SYMBOL in value &&
            (value as any)[MUTATION_SYMBOL] === true
          ) {
            return;
          }

          if (result[k] !== value) {
            diagnostics.push({
              path: currentPath,
              message: result[k] === undefined ? 'added' : 'updated',
              before: result[k],
              after: value,
            });
            result = { ...result, [k]: value };
          }
        });

        return { value: result, diagnostics };
      };

      updaters.push(updater);
    },
    get __updater(): Updater<T> {
      return (v, path) => applyUpdaters(v, path, updaters);
    },
  };

  return builder;
}

export type Updater<T> = (
  v: T,
  path: string,
) => { value: T; diagnostics: Diagnostic[] };

const applyUpdaters = <T>(
  value: T,
  path: string,
  fns: Updater<T>[],
): { value: T; diagnostics: Diagnostic[] } =>
  fns.reduce(
    (acc, fn) => {
      const next = fn(acc.value, path);
      return {
        value: next.value,
        diagnostics: [...acc.diagnostics, ...next.diagnostics],
      };
    },
    { value, diagnostics: [] as Diagnostic[] },
  );

export const pipe =
  <T>(...fns: Updater<T>[]): Updater<T> =>
  (v, path) =>
    applyUpdaters(v, path, fns);

const objUpdater = {
  add:
    <T extends object>(props: Partial<T>): Updater<T> =>
    (v: T = {} as T, path) => {
      const { next, diagnostics } = Object.entries(props).reduce(
        ({ next, diagnostics }, [k, val]) => {
          const prev = (v as Record<string, unknown>)[k];
          if (prev !== val) {
            diagnostics.push({
              path: `${path}.${k}`,
              message: prev === undefined ? 'added' : 'updated',
              before: prev,
              after: val,
            });
          }
          (next as Record<string, unknown>)[k] = val;
          return { next, diagnostics };
        },
        { next: { ...v } as T, diagnostics: [] as Diagnostic[] },
      );

      return { value: next, diagnostics };
    },

  remove:
    <T extends object>(...keys: (keyof T)[]): Updater<T> =>
    (v: T = {} as T, path) => {
      const next = { ...v } as T;
      const vRecord = v as Record<string, unknown>;
      const nextRecord = next as Record<string, unknown>;

      const diagnostics = keys
        .filter(k => {
          const keyStr = String(k);
          if (keyStr in nextRecord) {
            delete nextRecord[keyStr];
            return true;
          }
          return false;
        })
        .map(k => ({
          path: `${path}.${String(k)}`,
          message: 'removed',
          before: vRecord[String(k)],
        }));

      return { value: next, diagnostics };
    },
};

const arrUpdater = {
  add:
    <T>(...items: T[]): Updater<T[]> =>
    (v: T[] = [], path) => {
      const set = new Set(v);

      const { diagnostics } = items.reduce(
        (acc, item) => {
          if (!set.has(item)) {
            set.add(item);
            acc.diagnostics.push({
              path,
              message: 'added',
              after: item,
            });
          }
          return acc;
        },
        { diagnostics: [] as Diagnostic[] },
      );

      return { value: Array.from(set), diagnostics };
    },

  remove:
    <T>(...items: T[]): Updater<T[]> =>
    (v: T[] = [], path) => {
      const { kept, removed } = v.reduce(
        ({ kept, removed }, x) => {
          if (items.includes(x)) {
            removed.push({
              path,
              message: 'removed',
              before: x,
            });
          } else {
            kept.push(x);
          }
          return { kept, removed };
        },
        { kept: [] as T[], removed: [] as Diagnostic[] },
      );

      return { value: kept, diagnostics: removed };
    },
};

export type SyncResult = {
  diagnostics: Diagnostic[];
  matchedFile?: string;
  renamedFrom?: string;
  baselineValue?: Record<string, unknown>;
  formattedContent?: string;
};

export type BaselineConfig = {
  sync(tree: Tree): Diagnostic[] | SyncResult;
  projects?: string[];
  filePath?: string;
  matcher?: string | string[];
  tags?: string[];
};

export const createJsonBaselineTyped = <T extends object>(o: {
  matcher: string | string[];
  fileName: string;
  projects?: string[];
  baseline: (root: RootBuilder<T>) => void;
}): BaselineConfig => {
  const matchers = Array.isArray(o.matcher) ? o.matcher : [o.matcher];
  // Only add 'tsconfig.json' as fallback if fileName is 'tsconfig.json'
  // This prevents baselines for specific files (like tsconfig.tools.json) from matching tsconfig.json
  const fileMatcher: string[] = Array.from(
    new Set([
      ...matchers,
      ...(o.fileName === 'tsconfig.json' ? ['tsconfig.json'] : []),
    ]),
  );

  const rootBuilder = createRootBuilder<T>();
  o.baseline(rootBuilder);
  const updater = rootBuilder.__updater;

  return {
    projects: o.projects,
    filePath: o.fileName,
    matcher: o.matcher,
    sync(tree) {
      let diagnostics: Diagnostic[] = [];

      const path = findMatchingFile(
        tree as Tree & { children?: (path: string) => string[] },
        fileMatcher,
      );

      if (!path) {
        return diagnostics;
      }

      const current = readJson(tree, path);

      const result = updater(current, '');

      diagnostics = [...diagnostics, ...result.diagnostics];

      const finalValue = { ...result.value } as Record<string, unknown>;

      const include = finalValue.include;
      if (Array.isArray(include)) {
        finalValue.include = substitutePathsInArray(
          include,
          pathSubstitutions,
          path,
        );
      }
      const exclude = finalValue.exclude;
      if (Array.isArray(exclude)) {
        finalValue.exclude = substitutePathsInArray(
          exclude,
          pathSubstitutions,
          path,
        );
      }

      // Note: We don't write to the tree here - that's done by the sync command
      // This function only reports what needs to change

      // Check if this is a rename scenario (matched file != desired fileName)
      const pathFileName = path.split('/').pop() || '';
      const isRename = pathFileName !== o.fileName;

      return {
        diagnostics,
        matchedFile: path,
        baselineValue: finalValue, // Always return baselineValue for diffing
        ...(isRename ? { renamedFrom: path } : {}),
      };
    },
  };
};

export function createJsonBaseline(
  fileName: string,
  config: {
    tags?: string[];
    renameFrom?: string;
    [key: string]: any;
  },
): BaselineConfig {
  const { tags, renameFrom, ...baselineProps } = config;

  const baseConfig = createJsonBaselineTyped({
    matcher: fileName,
    fileName: fileName,
    baseline: root => root.set(baselineProps),
  });

  // Create a new config with additional properties
  const extendedConfig: BaselineConfig = {
    ...baseConfig,
    tags,
  };

  // Wrap the sync method to handle renaming
  if (renameFrom) {
    const originalSync = baseConfig.sync.bind(baseConfig);
    extendedConfig.sync = (tree: Tree) => {
      const renameFromMatchers = Array.isArray(renameFrom)
        ? renameFrom
        : [renameFrom];

      // Check if the file to rename exists
      const renameFromPath = findMatchingFile(
        tree as Tree & { children?: (path: string) => string[] },
        renameFromMatchers,
      );

      // Note: We don't actually rename the file here - that's done by the sync command
      // This function only reports what needs to change

      // If there's a file to rename, we need to sync against the OLD file content
      // But originalSync will try to find the NEW filename, so we need to create a wrapper tree
      let result;
      if (renameFromPath) {
        const targetPath = renameFromPath.replace(/[^/]+$/, fileName);

        // Create a wrapper tree that makes the old file appear as the new filename
        const wrapperTree = {
          ...tree,
          exists: (p: string) =>
            p === fileName ? tree.exists(renameFromPath) : tree.exists(p),
          read: (p: string, encoding?: BufferEncoding) =>
            p === fileName
              ? tree.read(renameFromPath, encoding ?? 'utf-8')
              : tree.read(p, encoding ?? 'utf-8'),
          write: (p: string, c: Buffer | string) => tree.write(p, c),
          delete: (p: string) => tree.delete(p),
          children: tree.children,
        };

        result = originalSync(wrapperTree as any);
      } else {
        result = originalSync(tree);
      }

      // Add rename info to result
      if (
        renameFromPath &&
        typeof result === 'object' &&
        'diagnostics' in result
      ) {
        return {
          ...result,
          renamedFrom: renameFromPath,
          // Override matchedFile to be the old file for diffing purposes
          matchedFile: renameFromPath,
        };
      }

      return result;
    };
  }

  return extendedConfig;
}
