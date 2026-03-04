import { promptPluginOptions, promptPluginSelection } from './prompts.js';
import type { PluginPromptDescriptor } from './types.js';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn(),
  input: vi.fn(),
  select: vi.fn(),
}));

const { input: mockInput, checkbox: mockCheckbox } = vi.mocked(
  await import('@inquirer/prompts'),
);

describe('promptPluginOptions', () => {
  const descriptors: PluginPromptDescriptor[] = [
    {
      key: 'eslint.patterns',
      message: 'Patterns',
      type: 'input',
      default: '.',
    },
  ];

  it('should use CLI arg when provided', async () => {
    await expect(
      promptPluginOptions(descriptors, { 'eslint.patterns': 'src' }),
    ).resolves.toStrictEqual({ 'eslint.patterns': 'src' });

    expect(mockInput).not.toHaveBeenCalled();
  });

  it('should use default in non-interactive mode', async () => {
    await expect(
      promptPluginOptions(descriptors, { yes: true }),
    ).resolves.toStrictEqual({ 'eslint.patterns': '.' });

    expect(mockInput).not.toHaveBeenCalled();
  });

  it('should call input prompt in interactive mode', async () => {
    mockInput.mockResolvedValue('src/**/*.ts');

    await expect(promptPluginOptions(descriptors, {})).resolves.toStrictEqual({
      'eslint.patterns': 'src/**/*.ts',
    });

    expect(mockInput).toHaveBeenCalledOnce();
  });

  it('should return checkbox values as array', async () => {
    mockCheckbox.mockResolvedValue(['json', 'csv']);

    await expect(
      promptPluginOptions(
        [
          {
            key: 'formats',
            message: 'Select formats',
            type: 'checkbox',
            choices: [
              { name: 'JSON', value: 'json' },
              { name: 'CSV', value: 'csv' },
            ],
            default: [],
          },
        ],
        {},
      ),
    ).resolves.toStrictEqual({ formats: ['json', 'csv'] });
  });

  it('should return empty array for checkbox in non-interactive mode', async () => {
    await expect(
      promptPluginOptions(
        [
          {
            key: 'formats',
            message: 'Select formats',
            type: 'checkbox',
            choices: [
              { name: 'JSON', value: 'json' },
              { name: 'CSV', value: 'csv' },
            ],
            default: [],
          },
        ],
        { yes: true },
      ),
    ).resolves.toStrictEqual({ formats: [] });
  });
});

describe('promptPluginSelection', () => {
  const bindings = [
    {
      slug: 'eslint',
      title: 'ESLint',
      packageName: '@code-pushup/eslint-plugin',
      generateConfig: () => ({ imports: [], pluginInit: '' }),
    },
    {
      slug: 'coverage',
      title: 'Code Coverage',
      packageName: '@code-pushup/coverage-plugin',
      generateConfig: () => ({ imports: [], pluginInit: '' }),
    },
    {
      slug: 'lighthouse',
      title: 'Lighthouse',
      packageName: '@code-pushup/lighthouse-plugin',
      generateConfig: () => ({ imports: [], pluginInit: '' }),
    },
  ];

  it('should return empty array when given no bindings', async () => {
    await expect(promptPluginSelection([], '/test', {})).resolves.toStrictEqual(
      [],
    );

    expect(mockCheckbox).not.toHaveBeenCalled();
  });

  describe('--plugins CLI arg', () => {
    it('should return matching bindings for valid slugs', async () => {
      await expect(
        promptPluginSelection(bindings, '/test', {
          plugins: 'eslint,lighthouse',
        }),
      ).resolves.toStrictEqual([bindings[0], bindings[2]]);

      expect(mockCheckbox).not.toHaveBeenCalled();
    });

    it('should throw on unknown slug', async () => {
      await expect(
        promptPluginSelection(bindings, '/test', { plugins: 'eslint,unknown' }),
      ).rejects.toThrow('Unknown plugin slugs: unknown');
    });
  });

  describe('--yes (non-interactive)', () => {
    it('should return only recommended plugins when some are recommended', async () => {
      const result = await promptPluginSelection(
        [
          { ...bindings[0]!, isRecommended: () => Promise.resolve(true) },
          bindings[1]!,
          bindings[2]!,
        ],
        '/test',
        { yes: true },
      );

      expect(result).toBeArrayOfSize(1);
      expect(result[0]).toHaveProperty('slug', 'eslint');
    });

    it('should return no plugins when none are recommended', async () => {
      await expect(
        promptPluginSelection(bindings, '/test', { yes: true }),
      ).resolves.toBeArrayOfSize(0);
    });
  });

  describe('interactive prompt', () => {
    it('should pre-check recommended plugins and leave others unchecked', async () => {
      mockCheckbox.mockResolvedValue(['eslint']);

      await promptPluginSelection(
        [
          { ...bindings[0]!, isRecommended: () => Promise.resolve(true) },
          bindings[1]!,
          bindings[2]!,
        ],
        '/test',
        {},
      );

      expect(mockCheckbox).toHaveBeenCalledWith(
        expect.objectContaining({
          required: true,
          choices: [
            { name: 'ESLint', value: 'eslint', checked: true },
            { name: 'Code Coverage', value: 'coverage', checked: false },
            { name: 'Lighthouse', value: 'lighthouse', checked: false },
          ],
        }),
      );
    });

    it('should not pre-check any plugins when none are recommended', async () => {
      mockCheckbox.mockResolvedValue(['eslint']);

      await promptPluginSelection(bindings, '/test', {});

      expect(mockCheckbox).toHaveBeenCalledWith(
        expect.objectContaining({
          required: true,
          choices: [
            { name: 'ESLint', value: 'eslint', checked: false },
            { name: 'Code Coverage', value: 'coverage', checked: false },
            { name: 'Lighthouse', value: 'lighthouse', checked: false },
          ],
        }),
      );
    });

    it('should return only user-selected bindings', async () => {
      mockCheckbox.mockResolvedValue(['coverage']);

      await expect(
        promptPluginSelection(bindings, '/test', {}),
      ).resolves.toStrictEqual([bindings[1]]);
    });
  });

  describe('isRecommended callback', () => {
    it('should receive targetDir as argument', async () => {
      const isRecommended = vi.fn().mockResolvedValue(false);

      mockCheckbox.mockResolvedValue(['eslint']);

      await promptPluginSelection(
        [{ ...bindings[0]!, isRecommended }],
        '/my/project',
        {},
      );

      expect(isRecommended).toHaveBeenCalledWith('/my/project');
    });
  });
});
