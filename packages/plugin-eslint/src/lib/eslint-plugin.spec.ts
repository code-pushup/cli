import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { SpyInstance } from 'vitest';
import { eslintPlugin } from './eslint-plugin';

describe('eslintPlugin', () => {
  const fixturesDir = join(
    fileURLToPath(dirname(import.meta.url)),
    '..',
    '..',
    'test',
    'fixtures',
  );

  let cwdSpy: SpyInstance;

  beforeAll(() => {
    cwdSpy = vi.spyOn(process, 'cwd');
  });

  afterAll(() => {
    cwdSpy.mockRestore();
  });

  it('should initialize ESLint plugin for React application', async () => {
    cwdSpy.mockReturnValue(join(fixturesDir, 'todos-app'));
    const plugin = await eslintPlugin({
      eslintrc: '.eslintrc.js',
      patterns: ['src/**/*.js', 'src/**/*.jsx'],
    });
    expect(plugin).toMatchSnapshot();
  });

  it('should initialize ESLint plugin for Nx project', async () => {
    cwdSpy.mockReturnValue(join(fixturesDir, 'nx-monorepo'));
    const plugin = await eslintPlugin({
      eslintrc: './packages/utils/.eslintrc.json',
      patterns: ['packages/utils/**/*.ts', 'packages/utils/**/*.json'],
    });
    expect(plugin).toMatchSnapshot();
  });
});
