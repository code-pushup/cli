const configFactoryMock = vi.hoisted(() => ({
  createVitestConfig: vi.fn().mockReturnValue('mocked-config'),
}));

vi.mock('./vitest-config-factory.js', () => configFactoryMock);

const MOCK_PROJECT_KEY = 'test-package';

describe('vitest-setup-presets', () => {
  let createUnitTestConfig: typeof import('./vitest-setup-presets.js').createUnitTestConfig;
  let createIntTestConfig: typeof import('./vitest-setup-presets.js').createIntTestConfig;
  let createE2ETestConfig: typeof import('./vitest-setup-presets.js').createE2ETestConfig;

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ createUnitTestConfig, createIntTestConfig, createE2ETestConfig } =
      await import('./vitest-setup-presets.js'));
  });

  describe('createUnitTestConfig', () => {
    it('should call createVitestConfig with unit kind', () => {
      const result = createUnitTestConfig(MOCK_PROJECT_KEY);

      expect(configFactoryMock.createVitestConfig).toHaveBeenCalledWith(
        MOCK_PROJECT_KEY,
        'unit',
      );
      expect(result).toBe('mocked-config');
    });

    it('should handle different project names', () => {
      createUnitTestConfig('my-custom-package');

      expect(configFactoryMock.createVitestConfig).toHaveBeenCalledWith(
        'my-custom-package',
        'unit',
      );
    });

    it('should handle empty projectKey', () => {
      createUnitTestConfig('');

      expect(configFactoryMock.createVitestConfig).toHaveBeenCalledWith(
        '',
        'unit',
      );
    });
  });

  describe('createIntTestConfig', () => {
    it('should call createVitestConfig with int kind', () => {
      const result = createIntTestConfig(MOCK_PROJECT_KEY);

      expect(configFactoryMock.createVitestConfig).toHaveBeenCalledWith(
        MOCK_PROJECT_KEY,
        'int',
      );
      expect(result).toBe('mocked-config');
    });

    it('should handle different project names', () => {
      createIntTestConfig('integration-package');

      expect(configFactoryMock.createVitestConfig).toHaveBeenCalledWith(
        'integration-package',
        'int',
      );
    });
  });

  describe('createE2ETestConfig', () => {
    it('should call createVitestConfig with e2e kind and no options', () => {
      const result = createE2ETestConfig(MOCK_PROJECT_KEY);

      expect(configFactoryMock.createVitestConfig).toHaveBeenCalledWith(
        MOCK_PROJECT_KEY,
        'e2e',
        undefined,
      );
      expect(result).toBe('mocked-config');
    });

    it('should pass options to createVitestConfig', () => {
      const options = {
        testTimeout: 60_000,
      };

      createE2ETestConfig(MOCK_PROJECT_KEY, options);

      expect(configFactoryMock.createVitestConfig).toHaveBeenCalledWith(
        MOCK_PROJECT_KEY,
        'e2e',
        options,
      );
    });

    it('should handle testTimeout option', () => {
      createE2ETestConfig(MOCK_PROJECT_KEY, { testTimeout: 30_000 });

      expect(configFactoryMock.createVitestConfig).toHaveBeenCalledWith(
        MOCK_PROJECT_KEY,
        'e2e',
        { testTimeout: 30_000 },
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

      expect(configFactoryMock.createVitestConfig).toHaveBeenNthCalledWith(
        1,
        'pkg1',
        'unit',
      );
      expect(configFactoryMock.createVitestConfig).toHaveBeenNthCalledWith(
        2,
        'pkg2',
        'int',
      );
      expect(configFactoryMock.createVitestConfig).toHaveBeenNthCalledWith(
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

      vi.mocked(configFactoryMock.createVitestConfig)
        .mockReturnValueOnce(mockConfigs.unit as any)
        .mockReturnValueOnce(mockConfigs.int as any)
        .mockReturnValueOnce(mockConfigs.e2e as any);

      expect(createUnitTestConfig('test')).toBe(mockConfigs.unit);
      expect(createIntTestConfig('test')).toBe(mockConfigs.int);
      expect(createE2ETestConfig('test')).toBe(mockConfigs.e2e);
    });
  });
});
