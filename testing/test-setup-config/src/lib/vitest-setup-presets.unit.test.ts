import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as configFactory from './vitest-config-factory.js';
import {
  createE2ETestConfig,
  createIntTestConfig,
  createUnitTestConfig,
} from './vitest-setup-presets.js';

vi.mock('./vitest-config-factory.js', () => ({
  createVitestConfig: vi.fn().mockReturnValue('mocked-config'),
}));

const MOCK_PROJECT_KEY = 'test-package';

describe('vitest-setup-presets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUnitTestConfig', () => {
    it('should call createVitestConfig with unit kind', () => {
      const result = createUnitTestConfig(MOCK_PROJECT_KEY);

      expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
        MOCK_PROJECT_KEY,
        'unit',
      );
      expect(result).toBe('mocked-config');
    });

    it('should handle different project names', () => {
      createUnitTestConfig('my-custom-package');

      expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
        'my-custom-package',
        'unit',
      );
    });

    it('should handle empty projectKey', () => {
      createUnitTestConfig('');

      expect(configFactory.createVitestConfig).toHaveBeenCalledWith('', 'unit');
    });
  });

  describe('createIntTestConfig', () => {
    it('should call createVitestConfig with int kind', () => {
      const result = createIntTestConfig(MOCK_PROJECT_KEY);

      expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
        MOCK_PROJECT_KEY,
        'int',
      );
      expect(result).toBe('mocked-config');
    });

    it('should handle different project names', () => {
      createIntTestConfig('integration-package');

      expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
        'integration-package',
        'int',
      );
    });
  });

  describe('createE2ETestConfig', () => {
    it('should call createVitestConfig with e2e kind and no options', () => {
      const result = createE2ETestConfig(MOCK_PROJECT_KEY);

      expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
        MOCK_PROJECT_KEY,
        'e2e',
        undefined,
      );
      expect(result).toBe('mocked-config');
    });

    it('should pass options to createVitestConfig', () => {
      const options = {
        testTimeout: 60_000,
        disableCoverage: true,
      };

      createE2ETestConfig(MOCK_PROJECT_KEY, options);

      expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
        MOCK_PROJECT_KEY,
        'e2e',
        options,
      );
    });

    it('should handle testTimeout option', () => {
      createE2ETestConfig(MOCK_PROJECT_KEY, { testTimeout: 30_000 });

      expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
        MOCK_PROJECT_KEY,
        'e2e',
        { testTimeout: 30_000 },
      );
    });

    it('should handle disableCoverage option', () => {
      createE2ETestConfig(MOCK_PROJECT_KEY, { disableCoverage: true });

      expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
        MOCK_PROJECT_KEY,
        'e2e',
        { disableCoverage: true },
      );
    });

    it('should handle multiple options', () => {
      const options = {
        testTimeout: 45_000,
        disableCoverage: false,
      };

      createE2ETestConfig(MOCK_PROJECT_KEY, options);

      expect(configFactory.createVitestConfig).toHaveBeenCalledWith(
        MOCK_PROJECT_KEY,
        'e2e',
        options,
      );
    });
  });

  describe('function naming', () => {
    it('should use clear descriptive names', () => {
      expect(createUnitTestConfig).toBeDefined();
      expect(createIntTestConfig).toBeDefined();
      expect(createE2ETestConfig).toBeDefined();
    });
  });

  describe('integration with factory', () => {
    it('should call factory with correct test kinds', () => {
      createUnitTestConfig('pkg1');
      createIntTestConfig('pkg2');
      createE2ETestConfig('pkg3');

      expect(configFactory.createVitestConfig).toHaveBeenNthCalledWith(
        1,
        'pkg1',
        'unit',
      );
      expect(configFactory.createVitestConfig).toHaveBeenNthCalledWith(
        2,
        'pkg2',
        'int',
      );
      expect(configFactory.createVitestConfig).toHaveBeenNthCalledWith(
        3,
        'pkg3',
        'e2e',
        undefined,
      );
    });

    it('should return whatever the factory returns', () => {
      const mockConfigs = {
        unit: { test: 'unit-config' },
        int: { test: 'int-config' },
        e2e: { test: 'e2e-config' },
      };

      vi.mocked(configFactory.createVitestConfig)
        .mockReturnValueOnce(mockConfigs.unit as any)
        .mockReturnValueOnce(mockConfigs.int as any)
        .mockReturnValueOnce(mockConfigs.e2e as any);

      expect(createUnitTestConfig('test')).toBe(mockConfigs.unit);
      expect(createIntTestConfig('test')).toBe(mockConfigs.int);
      expect(createE2ETestConfig('test')).toBe(mockConfigs.e2e);
    });
  });
});
