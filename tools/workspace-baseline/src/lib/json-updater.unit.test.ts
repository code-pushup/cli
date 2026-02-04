import { arr, obj, pipe } from './json-updater';

describe('obj.add', () => {
  it('should add new properties', () => {
    const updater = obj.add({ strict: true, noEmit: true });
    const result = updater({}, 'compilerOptions');

    expect(result.value).toStrictEqual({ strict: true, noEmit: true });
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics[0]).toStrictEqual({
      path: 'compilerOptions.strict',
      message: 'added',
      after: true,
    });
  });

  it('should update existing properties', () => {
    const updater = obj.add({ strict: true });
    const result = updater({ strict: false }, 'compilerOptions');

    expect(result.value).toStrictEqual({ strict: true });
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toStrictEqual({
      path: 'compilerOptions.strict',
      message: 'updated',
      before: false,
      after: true,
    });
  });

  it('should not add diagnostics if value unchanged', () => {
    const updater = obj.add({ strict: true });
    const result = updater({ strict: true }, 'compilerOptions');

    expect(result.value).toStrictEqual({ strict: true });
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should handle function values', () => {
    const updater = obj.add({
      strict: (current: boolean | undefined) => current ?? true,
    });
    const result = updater({}, 'compilerOptions');

    expect(result.value).toStrictEqual({ strict: true });
    expect(result.diagnostics).toHaveLength(1);
  });
});

describe('obj.remove', () => {
  it('should remove properties', () => {
    const updater = obj.remove('strict', 'noEmit');
    const result = updater({ strict: true, noEmit: false }, 'compilerOptions');

    expect(result.value).toStrictEqual({});
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics[0]).toStrictEqual({
      path: 'compilerOptions.strict',
      message: 'removed',
      before: true,
    });
  });

  it('should not add diagnostics if property does not exist', () => {
    const updater = obj.remove('strict');
    const result = updater({}, 'compilerOptions');

    expect(result.value).toStrictEqual({});
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('arr.add', () => {
  it('should add new items', () => {
    const updater = arr.add('src/**/*.ts', 'tests/**/*.ts');
    const result = updater([], 'include');

    expect(result.value).toStrictEqual(['src/**/*.ts', 'tests/**/*.ts']);
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics[0]).toStrictEqual({
      path: 'include',
      message: 'added',
      after: 'src/**/*.ts',
    });
  });

  it('should not add duplicate items', () => {
    const updater = arr.add('src/**/*.ts');
    const result = updater(['src/**/*.ts'], 'include');

    expect(result.value).toStrictEqual(['src/**/*.ts']);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should add only missing items', () => {
    const updater = arr.add('src/**/*.ts', 'tests/**/*.ts');
    const result = updater(['src/**/*.ts'], 'include');

    expect(result.value).toStrictEqual(['src/**/*.ts', 'tests/**/*.ts']);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toStrictEqual({
      path: 'include',
      message: 'added',
      after: 'tests/**/*.ts',
    });
  });
});

describe('arr.remove', () => {
  it('should remove items', () => {
    const updater = arr.remove('node_modules', 'dist');
    const result = updater(['src/**/*.ts', 'node_modules', 'dist'], 'exclude');

    expect(result.value).toStrictEqual(['src/**/*.ts']);
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics[0]).toStrictEqual({
      path: 'exclude',
      message: 'removed',
      before: 'node_modules',
    });
  });

  it('should not add diagnostics if item does not exist', () => {
    const updater = arr.remove('node_modules');
    const result = updater(['src/**/*.ts'], 'exclude');

    expect(result.value).toStrictEqual(['src/**/*.ts']);
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('pipe', () => {
  it('should compose multiple updaters', () => {
    const updater = pipe(
      obj.add({ strict: true }),
      obj.add({ noEmit: true }),
      obj.remove('noEmit'),
    );
    const result = updater({}, 'compilerOptions');

    expect(result.value).toStrictEqual({ strict: true });
    expect(result.diagnostics).toHaveLength(3);
  });

  it('should accumulate diagnostics from all updaters', () => {
    const updater = pipe(obj.add({ strict: true }), arr.add('src/**/*.ts'));
    const result = updater({}, 'root');

    expect(result.diagnostics).toHaveLength(2);
  });
});

describe('obj.pipe', () => {
  it('should compose object updaters', () => {
    const updater = obj.pipe(
      obj.add({ strict: true }),
      obj.add({ noEmit: true }),
      obj.remove('noEmit'),
    );
    const result = updater({}, 'compilerOptions');

    expect(result.value).toStrictEqual({ strict: true });
    expect(result.diagnostics).toHaveLength(3);
  });
});

describe('arr.pipe', () => {
  it('should compose array updaters', () => {
    const updater = arr.pipe(
      arr.add('src/**/*.ts'),
      arr.add('tests/**/*.ts'),
      arr.remove('tests/**/*.ts'),
    );
    const result = updater([], 'include');

    expect(result.value).toStrictEqual(['src/**/*.ts']);
    expect(result.diagnostics).toHaveLength(3);
  });
});
