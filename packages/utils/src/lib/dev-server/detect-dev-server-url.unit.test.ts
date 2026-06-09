import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import * as fileSystem from '../file-system.js';
import {
  detectDevServerUrl,
  detectDevServerUrlWithSource,
  resetDevServerUrlCache,
  resolveDevServerUrlPrompt,
} from './detect-dev-server-url.js';
import {
  detectPortFromScript,
  detectToolFromScript,
  parsePortFromScript,
} from './parse-port-from-script.js';

describe('parsePortFromScript', () => {
  it('should parse explicit --port flag', () => {
    expect(parsePortFromScript('vite --port 4000')).toBe(4000);
    expect(parsePortFromScript('next dev --port=3001')).toBe(3001);
    expect(parsePortFromScript('vite -p 5174')).toBe(5174);
  });

  it('should return undefined when no explicit port is present', () => {
    expect(parsePortFromScript('vite')).toBeUndefined();
  });
});

describe('detectToolFromScript', () => {
  it.each([
    ['vite', 'vite'],
    ['vite dev', 'vite'],
    ['next dev', 'next'],
    ['nuxt dev', 'nuxt'],
    ['astro dev', 'astro'],
    ['ng serve', 'angular'],
    ['nx serve app', 'angular'],
    ['react-scripts start', 'cra'],
    ['vue-cli-service serve', 'vueCli'],
    ['webpack serve', 'webpack'],
    ['webpack-dev-server', 'webpack'],
    ['parcel src/index.html', 'parcel'],
  ])('should detect %s as %s', (script, tool) => {
    expect(detectToolFromScript(script)).toBe(tool);
  });
});

describe('detectPortFromScript', () => {
  it('should prefer explicit port over tool default', () => {
    expect(detectPortFromScript('vite --port 4000')).toBe(4000);
  });

  it('should return tool default when no explicit port is present', () => {
    expect(detectPortFromScript('next dev')).toBe(3000);
    expect(detectPortFromScript('vite')).toBe(5173);
  });
});

describe('detectDevServerUrlWithSource', () => {
  beforeEach(() => {
    vol.reset();
    resetDevServerUrlCache();
  });

  it('should fall back to localhost:4200 for an empty directory', async () => {
    vol.fromJSON({ '.gitkeep': '' }, MEMFS_VOLUME);

    await expect(
      detectDevServerUrlWithSource(MEMFS_VOLUME),
    ).resolves.toStrictEqual({
      url: 'http://localhost:4200',
      port: 4200,
      source: 'fallback',
    });
  });

  it('should detect Vite default port from vite.config.js', async () => {
    vol.fromJSON(
      {
        'vite.config.js': 'export default { plugins: [] }',
      },
      MEMFS_VOLUME,
    );

    await expect(
      detectDevServerUrlWithSource(MEMFS_VOLUME),
    ).resolves.toStrictEqual({
      url: 'http://localhost:5173',
      port: 5173,
      source: 'vite.config.js',
    });
  });

  it('should detect Vite default port from vite.config.mts', async () => {
    vol.fromJSON(
      {
        'vite.config.mts': 'export default { plugins: [] }',
      },
      MEMFS_VOLUME,
    );

    await expect(
      detectDevServerUrlWithSource(MEMFS_VOLUME),
    ).resolves.toStrictEqual({
      url: 'http://localhost:5173',
      port: 5173,
      source: 'vite.config.mts',
    });
  });

  it('should detect custom Vite port from vite.config.ts', async () => {
    vol.fromJSON(
      {
        'vite.config.ts': 'export default { server: { port: 3001 } }',
      },
      MEMFS_VOLUME,
    );

    await expect(
      detectDevServerUrlWithSource(MEMFS_VOLUME),
    ).resolves.toStrictEqual({
      url: 'http://localhost:3001',
      port: 3001,
      source: 'vite.config.ts',
    });
  });

  it('should detect Angular port from angular.json', async () => {
    vol.fromJSON(
      {
        'angular.json': JSON.stringify({
          projects: {
            app: {
              architect: {
                serve: {
                  options: {
                    port: 4300,
                  },
                },
              },
            },
          },
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      detectDevServerUrlWithSource(MEMFS_VOLUME),
    ).resolves.toStrictEqual({
      url: 'http://localhost:4300',
      port: 4300,
      source: 'angular.json',
    });
  });

  it('should detect Next.js default from package.json dev script', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({
          scripts: { dev: 'next dev' },
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      detectDevServerUrlWithSource(MEMFS_VOLUME),
    ).resolves.toStrictEqual({
      url: 'http://localhost:3000',
      port: 3000,
      source: 'package.json dev script',
    });
  });

  it('should detect webpack devServer port from webpack.config.js', async () => {
    vol.fromJSON(
      {
        'webpack.config.js': 'module.exports = { devServer: { port: 9000 } }',
      },
      MEMFS_VOLUME,
    );

    await expect(
      detectDevServerUrlWithSource(MEMFS_VOLUME),
    ).resolves.toStrictEqual({
      url: 'http://localhost:9000',
      port: 9000,
      source: 'webpack.config.js',
    });
  });

  it('should detect Vite port from package.json dependency when scripts are generic', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({
          scripts: { dev: 'node ./scripts/dev.mjs' },
          devDependencies: { vite: '^8.0.0' },
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      detectDevServerUrlWithSource(MEMFS_VOLUME),
    ).resolves.toStrictEqual({
      url: 'http://localhost:5173',
      port: 5173,
      source: 'package.json dependencies',
    });
  });

  it('should detect Nx serve port from project.json', async () => {
    vol.fromJSON(
      {
        'project.json': JSON.stringify({
          targets: {
            serve: {
              options: {
                port: 4400,
              },
            },
          },
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      detectDevServerUrlWithSource(MEMFS_VOLUME),
    ).resolves.toStrictEqual({
      url: 'http://localhost:4400',
      port: 4400,
      source: 'project.json',
    });
  });

  it('should cache detection results per target directory', async () => {
    vol.fromJSON({ 'vite.config.js': 'export default {}' }, MEMFS_VOLUME);
    const readTextFileSpy = vi.spyOn(fileSystem, 'readTextFile');

    await detectDevServerUrlWithSource(MEMFS_VOLUME);
    await detectDevServerUrlWithSource(MEMFS_VOLUME);

    expect(readTextFileSpy).toHaveBeenCalledTimes(1);
    readTextFileSpy.mockRestore();
  });
});

describe('detectDevServerUrl', () => {
  beforeEach(() => {
    vol.reset();
    resetDevServerUrlCache();
  });

  it('should return only the URL string', async () => {
    vol.fromJSON({ 'vite.config.js': 'export default {}' }, MEMFS_VOLUME);

    await expect(detectDevServerUrl(MEMFS_VOLUME)).resolves.toBe(
      'http://localhost:5173',
    );
  });
});

describe('resolveDevServerUrlPrompt', () => {
  beforeEach(() => {
    vol.reset();
    resetDevServerUrlCache();
  });

  it('should include detection source in the prompt message', async () => {
    vol.fromJSON({ 'vite.config.js': 'export default {}' }, MEMFS_VOLUME);

    await expect(
      resolveDevServerUrlPrompt(MEMFS_VOLUME),
    ).resolves.toStrictEqual({
      default: 'http://localhost:5173',
      message: 'Target URL(s) (detected from vite.config.js, comma-separated):',
    });
  });

  it('should use generic message for fallback detection', async () => {
    vol.fromJSON({ '.gitkeep': '' }, MEMFS_VOLUME);

    await expect(
      resolveDevServerUrlPrompt(MEMFS_VOLUME),
    ).resolves.toStrictEqual({
      default: 'http://localhost:4200',
      message: 'Target URL(s) (comma-separated):',
    });
  });
});
