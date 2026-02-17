import { promptPluginOptions } from './prompts.js';
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
