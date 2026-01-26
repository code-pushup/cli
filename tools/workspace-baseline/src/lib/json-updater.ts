/* ============================== core types ============================== */

export type Diagnostic = {
  path: string;
  message: string;
  before?: unknown;
  after?: unknown;
};

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

/* ============================== usage pattern ============================ */
/*
const result = obj.pipe(
  obj.add({ outDir: './dist' }),
  obj.remove('noEmit'),
)(current.compilerOptions, 'compilerOptions')

tree.write(path, JSON.stringify(result.value, null, 2))
return result.diagnostics
*/
