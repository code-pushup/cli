import {
  addLcovReporter,
  buildNestedObject,
  hasLcovReporter,
} from './config-file.js';

describe('hasLcovReporter', () => {
  it('should return true for vitest reporter with lcov', () => {
    expect(hasLcovReporter("reporter: ['text', 'lcov']", 'vitest')).toBeTrue();
  });

  it('should return false for vitest reporter without lcov', () => {
    expect(hasLcovReporter("reporter: ['text']", 'vitest')).toBeFalse();
  });

  it('should return false for vitest without reporter key', () => {
    expect(hasLcovReporter('globals: true', 'vitest')).toBeFalse();
  });

  it('should return true for jest without coverageReporters (lcov is default)', () => {
    expect(hasLcovReporter('testEnvironment: "node"', 'jest')).toBeTrue();
  });

  it('should return true for jest coverageReporters with lcov', () => {
    expect(
      hasLcovReporter("coverageReporters: ['text', 'lcov']", 'jest'),
    ).toBeTrue();
  });

  it('should return false for jest coverageReporters without lcov', () => {
    expect(hasLcovReporter("coverageReporters: ['text']", 'jest')).toBeFalse();
  });
});

describe('addLcovReporter', () => {
  it('should append lcov to existing vitest reporter array', () => {
    const input = `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text'],
    },
  },
});
`;
    expect(addLcovReporter(input, 'vitest')).toMatchInlineSnapshot(`
      "import { defineConfig } from 'vitest/config';

      export default defineConfig({
        test: {
          coverage: {
            reporter: ['text', 'lcov'],
          },
        },
      });"
    `);
  });

  it('should add coverage block to vitest config when missing', () => {
    const input = `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
`;
    expect(addLcovReporter(input, 'vitest')).toMatchInlineSnapshot(`
      "import { defineConfig } from 'vitest/config';

      export default defineConfig({
        test: {
          globals: true,

          coverage: {
            reporter: ['text', 'html', 'clover', 'json', 'lcov'],
          },
        },
      });"
    `);
  });

  it('should append lcov to existing jest coverageReporters', () => {
    const input = `export default {
  coverageReporters: ['text'],
};
`;
    expect(addLcovReporter(input, 'jest')).toMatchInlineSnapshot(`
      "export default {
        coverageReporters: ['text', 'lcov'],
      };"
    `);
  });

  it('should not modify jest config when coverageReporters is missing (lcov enabled by default)', () => {
    const input = `export default {
  testEnvironment: 'node',
};
`;
    expect(addLcovReporter(input, 'jest')).toBe(input);
  });

  it('should return CJS config unchanged', () => {
    const input = `module.exports = { coverageReporters: ['text'] };`;
    expect(addLcovReporter(input, 'jest')).toBe(input);
  });
});

describe('buildNestedObject', () => {
  it('should wrap value in nested structure', () => {
    expect(
      buildNestedObject(['test', 'coverage', 'reporter'], ['lcov']),
    ).toEqual({ test: { coverage: { reporter: ['lcov'] } } });
  });

  it('should return value directly for empty segments', () => {
    expect(buildNestedObject([], ['lcov'])).toEqual(['lcov']);
  });
});
