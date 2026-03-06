import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { promptConfigFormat, resolveFilename } from './config-format.js';
import type { ConfigFileFormat } from './types.js';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn(),
  input: vi.fn(),
  select: vi.fn(),
}));

const { select: mockSelect } = vi.mocked(await import('@inquirer/prompts'));

describe('resolveConfigFilename', () => {
  it.each<[ConfigFileFormat, boolean, string]>([
    ['ts', false, 'code-pushup.config.ts'],
    ['mjs', false, 'code-pushup.config.mjs'],
    ['js', true, 'code-pushup.config.js'],
    ['js', false, 'code-pushup.config.mjs'],
  ])('should resolve format %j (ESM: %j) to %j', (format, isEsm, expected) => {
    expect(resolveFilename('code-pushup.config', format, isEsm)).toBe(expected);
  });
});

describe('promptConfigFormat', () => {
  it('should detect "ts" default when tsconfig.json exists', async () => {
    vol.fromJSON({ 'tsconfig.json': '{}' }, MEMFS_VOLUME);
    mockSelect.mockResolvedValue('ts');
    await promptConfigFormat(MEMFS_VOLUME, {});
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({ default: 'ts' }),
    );
  });

  it('should detect "ts" default when tsconfig.*.json variant exists', async () => {
    vol.fromJSON({ 'tsconfig.app.json': '{}' }, MEMFS_VOLUME);
    mockSelect.mockResolvedValue('ts');
    await promptConfigFormat(MEMFS_VOLUME, {});
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({ default: 'ts' }),
    );
  });

  it('should detect "js" default when no tsconfig exists', async () => {
    vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);
    mockSelect.mockResolvedValue('js');
    await promptConfigFormat(MEMFS_VOLUME, {});
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({ default: 'js' }),
    );
  });
});
