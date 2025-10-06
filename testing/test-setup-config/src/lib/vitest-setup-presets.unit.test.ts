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

describe('createUnitConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createVitestConfig with correct parameters and default setupFiles', () => {
    createUnitConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'unit',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: setupPresets.unit.base,
        },
      },
    );
  });

  it('should use custom setupFiles from overrides when provided', () => {
    const customSetupFiles = ['unit-setup1.ts', 'unit-setup2.ts'];
    const overrides: VitestOverrides = {
      test: {
        setupFiles: customSetupFiles,
      },
    };

    createUnitConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'unit',
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
    const overrides: VitestOverrides = {
      test: {
        testTimeout: TEST_TIMEOUTS.MEDIUM,
        globals: false,
      },
      build: {
        target: 'es2020',
      },
    };

    createUnitConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'unit',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          testTimeout: TEST_TIMEOUTS.MEDIUM,
          globals: false,
          setupFiles: setupPresets.unit.base,
        },
        build: {
          target: 'es2020',
        },
      },
    );
  });

  it('should handle overrides with custom setupFiles and other test options', () => {
    const customSetupFiles = ['unit-custom.ts'];
    const overrides: VitestOverrides = {
      test: {
        setupFiles: customSetupFiles,
        testTimeout: TEST_TIMEOUTS.SHORT,
        environment: 'jsdom' as any,
      },
    };

    createUnitConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'unit',
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
    createUnitConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, undefined);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'unit',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: setupPresets.unit.base,
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

    createUnitConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'unit',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        build: {
          target: 'es2020',
        },
        test: {
          setupFiles: setupPresets.unit.base,
        },
      },
    );
  });

  it('should return the result from createVitestConfig', () => {
    const result = createUnitConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS);

    expect(result).toBe('mocked-config');
  });

  it('should handle empty projectKey gracefully', () => {
    const result = createUnitConfig('', MOCK_CONFIG_REST_PARAMS);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: '',
        kind: 'unit',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: setupPresets.unit.base,
        },
      },
    );
    expect(result).toBe('mocked-config');
  });
});

describe('createIntConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createVitestConfig with correct parameters and default setupFiles', () => {
    createIntConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'int',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: setupPresets.int.base,
        },
      },
    );
  });

  it('should use custom setupFiles from overrides when provided', () => {
    const customSetupFiles = ['int-setup1.ts', 'int-setup2.ts'];
    const overrides: VitestOverrides = {
      test: {
        setupFiles: customSetupFiles,
      },
    };

    createIntConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'int',
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
    const overrides: VitestOverrides = {
      test: {
        testTimeout: TEST_TIMEOUTS.MEDIUM,
        globals: false,
      },
      build: {
        target: 'es2020',
      },
    };

    createIntConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'int',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          testTimeout: TEST_TIMEOUTS.MEDIUM,
          globals: false,
          setupFiles: setupPresets.int.base,
        },
        build: {
          target: 'es2020',
        },
      },
    );
  });

  it('should handle overrides with custom setupFiles and other test options', () => {
    const customSetupFiles = ['int-custom.ts'];
    const overrides: VitestOverrides = {
      test: {
        setupFiles: customSetupFiles,
        testTimeout: TEST_TIMEOUTS.SHORT,
        environment: 'jsdom' as any,
      },
    };

    createIntConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'int',
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
    createIntConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, undefined);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'int',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: setupPresets.int.base,
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

    createIntConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'int',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        build: {
          target: 'es2020',
        },
        test: {
          setupFiles: setupPresets.int.base,
        },
      },
    );
  });

  it('should return the result from createVitestConfig', () => {
    const result = createIntConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS);

    expect(result).toBe('mocked-config');
  });

  it('should handle empty projectKey gracefully', () => {
    const result = createIntConfig('', MOCK_CONFIG_REST_PARAMS);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: '',
        kind: 'int',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: setupPresets.int.base,
        },
      },
    );
    expect(result).toBe('mocked-config');
  });
});

describe('createE2eConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createVitestConfig with correct parameters and default setupFiles', () => {
    createE2eConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'e2e',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: setupPresets.e2e.base,
        },
      },
    );
  });

  it('should use custom setupFiles from overrides when provided', () => {
    const customSetupFiles = ['e2e-setup1.ts', 'e2e-setup2.ts'];
    const overrides: VitestOverrides = {
      test: {
        setupFiles: customSetupFiles,
      },
    };

    createE2eConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'e2e',
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
    const overrides: VitestOverrides = {
      test: {
        testTimeout: TEST_TIMEOUTS.MEDIUM,
        globals: false,
      },
      build: {
        target: 'es2020',
      },
    };

    createE2eConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'e2e',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          testTimeout: TEST_TIMEOUTS.MEDIUM,
          globals: false,
          setupFiles: setupPresets.e2e.base,
        },
        build: {
          target: 'es2020',
        },
      },
    );
  });

  it('should handle overrides with custom setupFiles and other test options', () => {
    const customSetupFiles = ['e2e-custom.ts'];
    const overrides: VitestOverrides = {
      test: {
        setupFiles: customSetupFiles,
        testTimeout: TEST_TIMEOUTS.SHORT,
        environment: 'jsdom' as any,
      },
    };

    createE2eConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'e2e',
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
    createE2eConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, undefined);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'e2e',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: setupPresets.e2e.base,
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

    createE2eConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS, overrides);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: MOCK_PROJECT_KEY,
        kind: 'e2e',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        build: {
          target: 'es2020',
        },
        test: {
          setupFiles: setupPresets.e2e.base,
        },
      },
    );
  });

  it('should return the result from createVitestConfig', () => {
    const result = createE2eConfig(MOCK_PROJECT_KEY, MOCK_CONFIG_REST_PARAMS);

    expect(result).toBe('mocked-config');
  });

  it('should handle empty projectKey gracefully', () => {
    const result = createE2eConfig('', MOCK_CONFIG_REST_PARAMS);

    expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
      {
        projectKey: '',
        kind: 'e2e',
        ...MOCK_CONFIG_REST_PARAMS,
      },
      {
        test: {
          setupFiles: setupPresets.e2e.base,
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
