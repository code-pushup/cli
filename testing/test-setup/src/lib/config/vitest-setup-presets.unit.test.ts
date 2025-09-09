import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VitestOverrides } from './vitest-config-factory.js';
import * as configFactory from './vitest-config-factory.js';
import {
  createE2eConfig,
  createIntConfig,
  createUnitConfig,
  setupPresets,
} from './vitest-setup-presets.js';

vi.mock('./vitest-config-factory.js', () => ({
  createVitestConfig: vi.fn().mockReturnValue('mocked-config'),
}));

const MOCK_PROJECT_KEY = 'test-package';
const MOCK_CONFIG_REST_PARAMS = {
  projectRoot: '/test/project',
  cacheKey: 'test-cache',
};

const TEST_TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10_000,
  LONG: 15_000,
  E2E: 60_000,
} as const;

describe('setupPresets', () => {
  it('should export correct unit setup presets', () => {
    expect(setupPresets.unit).toEqual({
      base: [
        'testing/test-setup/src/lib/console.mock.ts',
        'testing/test-setup/src/lib/reset.mocks.ts',
        'testing/test-setup/src/lib/cliui.mock.ts',
        'testing/test-setup/src/lib/fs.mock.ts',
        'testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
      ],
      git: ['testing/test-setup/src/lib/git.mock.ts'],
      portalClient: ['testing/test-setup/src/lib/portal-client.mock.ts'],
      matchersCore: [
        'testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
        'testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
      ],
      matcherPath: ['testing/test-setup/src/lib/extend/path.matcher.ts'],
    });
  });

  it('should export correct integration setup presets', () => {
    expect(setupPresets.int).toEqual({
      base: [
        'testing/test-setup/src/lib/console.mock.ts',
        'testing/test-setup/src/lib/reset.mocks.ts',
      ],
      cliui: ['testing/test-setup/src/lib/cliui.mock.ts'],
      fs: ['testing/test-setup/src/lib/fs.mock.ts'],
      git: ['testing/test-setup/src/lib/git.mock.ts'],
      portalClient: ['testing/test-setup/src/lib/portal-client.mock.ts'],
      matcherPath: ['testing/test-setup/src/lib/extend/path.matcher.ts'],
      chromePath: ['testing/test-setup/src/lib/chrome-path.mock.ts'],
    });
  });

  it('should export correct e2e setup presets', () => {
    expect(setupPresets.e2e).toEqual({
      base: ['testing/test-setup/src/lib/reset.mocks.ts'],
    });
  });

  it('should be defined as a const object', () => {
    expect(setupPresets).toBeDefined();
    expect(typeof setupPresets).toBe('object');
  });
});

// Parameterized tests to eliminate duplication
describe.each([
  ['unit', setupPresets.unit.base, createUnitConfig],
  ['int', setupPresets.int.base, createIntConfig],
  ['e2e', setupPresets.e2e.base, createE2eConfig],
] as const)('%s config creation', (kind, baseSetupFiles, createFn) => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createVitestConfig with correct parameters and default setupFiles', () => {
    createFn(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind,
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: baseSetupFiles,
        },
      },
    );
  });

  it('should use custom setupFiles from overrides when provided', () => {
    const customSetupFiles = [`${kind}-setup1.ts`, `${kind}-setup2.ts`];
    const overrides: VitestOverrides = {
      test: {
        setupFiles: customSetupFiles,
      },
    };

    createFn(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind,
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: customSetupFiles,
        },
      },
    );
  });

  it('should merge other overrides correctly while using default setupFiles', () => {
    const testTimeout =
      kind === 'unit'
        ? TEST_TIMEOUTS.MEDIUM
        : kind === 'int'
          ? TEST_TIMEOUTS.LONG
          : TEST_TIMEOUTS.E2E;

    const overrides: VitestOverrides = {
      test: {
        testTimeout,
        globals: false,
      },
      build: {
        target: 'es2020',
      },
    };

    createFn(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind,
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          testTimeout,
          globals: false,
          setupFiles: baseSetupFiles,
        },
        build: {
          target: 'es2020',
        },
      },
    );
  });

  it('should handle overrides with custom setupFiles and other test options', () => {
    const customSetupFiles = [`${kind}-custom.ts`];
    const overrides: VitestOverrides = {
      test: {
        setupFiles: customSetupFiles,
        testTimeout: TEST_TIMEOUTS.SHORT,
        environment: 'jsdom' as any,
      },
    };

    createFn(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind,
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: customSetupFiles,
          testTimeout: TEST_TIMEOUTS.SHORT,
          environment: 'jsdom',
        },
      },
    );
  });

  it('should handle undefined overrides', () => {
    createFn(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, undefined);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind,
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: baseSetupFiles,
        },
      },
    );
  });

  it('should handle overrides without test config', () => {
    const overrides: VitestOverrides = {
      build: {
        target: 'es2020',
      },
    };

    createFn(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind,
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        build: {
          target: 'es2020',
        },
        test: {
          setupFiles: baseSetupFiles,
        },
      },
    );
  });

  it('should return the result from createVitestConfig', () => {
    const result = createFn(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS);

    expect(result).toBe('mocked-config');
  });

  it('should handle empty projectKey gracefully', () => {
    const result = createFn('', MOCK_CONFIG_REST_PARAMS);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: '',
        kind,
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: baseSetupFiles,
        },
      },
    );
    expect(result).toBe('mocked-config');
  });
});

describe('integration between preset functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use different setup presets for different test kinds', () => {
    createUnitConfig('test-pkg', { projectRoot: '/test' });
    createIntConfig('test-pkg', { projectRoot: '/test' });
    createE2eConfig('test-pkg', { projectRoot: '/test' });

    expect(configFactory.createVitestConfig).toHaveBeenCalledTimes(3);

    expect(configFactory.createVitestConfig).toHaveBeenNthCalledWith(
      1,
      { projectKey: 'test-pkg', kind: 'unit', projectRoot: '/test' },
      { test: { setupFiles: setupPresets.unit.base } },
    );

    expect(configFactory.createVitestConfig).toHaveBeenNthCalledWith(
      2,
      { projectKey: 'test-pkg', kind: 'int', projectRoot: '/test' },
      { test: { setupFiles: setupPresets.int.base } },
    );

    expect(configFactory.createVitestConfig).toHaveBeenNthCalledWith(
      3,
      { projectKey: 'test-pkg', kind: 'e2e', projectRoot: '/test' },
      { test: { setupFiles: setupPresets.e2e.base } },
    );
  });

  it('should handle complex scenarios with all preset functions', () => {
    const complexOverrides: VitestOverrides = {
      test: {
        setupFiles: ['global-setup.ts'],
        testTimeout: TEST_TIMEOUTS.LONG,
        coverage: {
          enabled: true,
          thresholds: {
            global: {
              statements: 90,
            },
          },
        },
      },
      build: {
        target: 'es2022',
      },
    };

    const restParams = {
      projectRoot: '/complex/project',
      cacheKey: 'complex-cache',
    };

    createUnitConfig('complex-unit', restParams, complexOverrides);
    createIntConfig('complex-int', restParams, complexOverrides);
    createE2eConfig('complex-e2e', restParams, complexOverrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledTimes(3);

    const calls = (configFactory.createVitestConfig as any).mock.calls;
    calls.forEach((call: any) => {
      expect(call[1].test.setupFiles).toStrictEqual(['global-setup.ts']);
    });

    expect(calls[0][0].kind).toBe('unit');
    expect(calls[1][0].kind).toBe('int');
    expect(calls[2][0].kind).toBe('e2e');
  });
});
