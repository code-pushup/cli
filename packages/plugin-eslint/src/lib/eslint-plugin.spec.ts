import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { SpyInstance } from 'vitest';
import { eslintPlugin } from './eslint-plugin';

const appRootDir = join(
  fileURLToPath(dirname(import.meta.url)),
  '..',
  '..',
  'test',
  'fixtures',
  'todos-app',
);

describe('eslintPlugin', () => {
  let cwdSpy: SpyInstance;

  beforeAll(() => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(appRootDir);
  });

  afterAll(() => {
    cwdSpy.mockRestore();
  });

  it('should initialize ESLint plugin', async () => {
    const plugin = await eslintPlugin({
      eslintrc: '.eslintrc.js',
      patterns: ['src/**/*.js', 'src/**/*.jsx'],
    });
    expect(plugin).toMatchSnapshot();
  });
});
