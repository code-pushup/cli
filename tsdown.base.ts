import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type UserConfig, defineConfig } from 'tsdown';

export function baseConfig(options: {
  projectRoot: string;
  projectName?: string;
}): UserConfig {
  const { projectRoot } = options;

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

        // Adjust paths for the dist directory
        if (packageJson.main) {
          packageJson.main = packageJson.main.replace(/^dist\//, '');
        }
        if (packageJson.module) {
          packageJson.module = packageJson.module.replace(/^dist\//, '');
        }
        if (packageJson.types) {
          packageJson.types = packageJson.types.replace(/^dist\//, '');
        }

        // Generate exports field for dual ESM/CJS support
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
