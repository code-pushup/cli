import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type UserConfig, defineConfig } from 'tsdown';

export function baseConfig(options: { projectRoot: string }): UserConfig {
  const { projectRoot } = options;

  // Read package.json to get additional files to copy
  const packageJsonPath = join(projectRoot, 'package.json');
  let additionalCopyFiles: Array<{ from: string; to: string }> = [];

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    if (packageJson.files && Array.isArray(packageJson.files)) {
      additionalCopyFiles = packageJson.files
        .filter((file: string) => {
          // Skip negation patterns (starting with !)
          if (file.startsWith('!')) return false;
          // Skip 'src' as it's already handled by the build output
          if (file === 'src') return false;
          // Include files that start with ./ or are specific files
          return file.startsWith('./') || !file.includes('/');
        })
        .map((file: string) => ({
          from: join(projectRoot, file),
          to: join(projectRoot, 'dist', file),
        }));
    }
  } catch (error) {
    // If package.json doesn't exist or can't be read, continue without additional files
  }

  return defineConfig({
    entry: `${projectRoot}/src/**/!(*.test|*.mock).ts`,
    tsconfig: `${projectRoot}/tsconfig.lib.json`,
    outDir: `${projectRoot}/dist/src`,
    unbundle: true,
    format: ['esm', 'cjs'],
    fixedExtension: true,
    dts: true,
    hash: false,
    external: [],
    exports: true,
    copy: [
      {
        from: `${projectRoot}/package.json`,
        to: `${projectRoot}/dist/package.json`,
      },
      {
        from: `${projectRoot}/README.md`,
        to: `${projectRoot}/dist/README.md`,
      },
      ...additionalCopyFiles,
    ],
    async onSuccess() {
      const distPackageJsonPath = join(projectRoot, 'dist', 'package.json');

      try {
        const packageJson = JSON.parse(
          await readFile(distPackageJsonPath, 'utf8'),
        );

        // Remove fields not needed in published package
        delete packageJson.devDependencies;
        delete packageJson.scripts;
        delete packageJson.nx;

        // Update files field to include built output
        if (packageJson.files) {
          packageJson.files = packageJson.files.map((file: string) =>
            file === 'src' ? 'src' : file,
          );
        }

        // Detect if this is a CJS-only build by checking if .mjs files exist
        const { existsSync } = await import('node:fs');
        const indexMjsPath = join(projectRoot, 'dist', 'src', 'index.mjs');
        const isCjsOnly = !existsSync(indexMjsPath);

        // Adjust paths for the dist directory
        if (packageJson.main) {
          packageJson.main = packageJson.main.replace(/^dist\//, '');
          if (isCjsOnly) {
            packageJson.main = packageJson.main.replace(/\.js$/, '.cjs');
          }
        }
        if (packageJson.module) {
          packageJson.module = packageJson.module.replace(/^dist\//, '');
        }
        if (packageJson.types) {
          packageJson.types = packageJson.types.replace(/^dist\//, '');
        }
        if (packageJson.typings) {
          packageJson.typings = packageJson.typings.replace(/^dist\//, '');
          if (isCjsOnly) {
            packageJson.typings = packageJson.typings.replace(
              /\.d\.ts$/,
              '.d.cts',
            );
          }
        }

        // Update bin field to use correct extension for built files
        if (packageJson.bin) {
          if (typeof packageJson.bin === 'string') {
            // Single bin entry
            packageJson.bin = packageJson.bin
              .replace(/^dist\//, '')
              .replace(/\.js$/, '.mjs');
          } else {
            // Multiple bin entries
            packageJson.bin = Object.fromEntries(
              Object.entries(packageJson.bin).map(([name, path]) => [
                name,
                (path as string)
                  .replace(/^dist\//, '')
                  .replace(/\.js$/, '.mjs'),
              ]),
            );
          }
        }

        // Generate exports field based on format
        if (isCjsOnly) {
          // CJS-only exports
          packageJson.exports = {
            '.': {
              require: './src/index.cjs',
              types: './src/index.d.cts',
            },
            './*': {
              require: './src/*/index.cjs',
              types: './src/*/index.d.cts',
            },
            './*/': {
              require: './src/*/index.cjs',
              types: './src/*/index.d.cts',
            },
            './*.js': {
              require: './src/*.cjs',
              types: './src/*.d.cts',
            },
          };
        } else {
          // Dual ESM/CJS exports
          packageJson.exports = {
            '.': {
              import: './src/index.mjs',
              require: './src/index.cjs',
              types: './src/index.d.mts',
            },
            './*': {
              import: './src/*/index.mjs',
              require: './src/*/index.cjs',
              types: './src/*/index.d.mts',
            },
            './*/': {
              import: './src/*/index.mjs',
              require: './src/*/index.cjs',
              types: './src/*/index.d.mts',
            },
            './*.js': {
              import: './src/*.mjs',
              require: './src/*.cjs',
              types: './src/*.d.mts',
            },
          };
        }

        await writeFile(
          distPackageJsonPath,
          JSON.stringify(packageJson, null, 2),
          'utf8',
        );
      } catch (error) {
        // If package.json doesn't exist in dist (e.g., copy was overridden), skip modification
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    },
  });
}

export function getProjectNameFromActiveTask(): string {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];

  if (!projectName || typeof projectName !== 'string') {
    throw new Error('NX_TASK_TARGET_PROJECT is not set');
  }

  return projectName;
}

export async function getExternalDependencies(cwd: string): Promise<string[]> {
  try {
    const packageJson = JSON.parse(
      await readFile(join(cwd, 'package.json'), 'utf8'),
    );

    return [
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.devDependencies || {}),
      ...Object.keys(packageJson.optionalDependencies || {}),
      ...Object.keys(packageJson.peerDependencies || {}),
    ];
  } catch {
    // No package.json or unable to read it - return empty array
    return [];
  }
}
