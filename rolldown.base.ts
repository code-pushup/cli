import { readFileSync } from 'node:fs';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  type OutputOptions,
  type RolldownOptions,
  defineConfig,
} from 'rolldown';

/**
 * Reads and parses package.json from a given path
 */
function readPackageJson(packageJsonPath: string): Record<string, any> | null {
  try {
    return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    return null;
  }
}

/**
 * Extracts all dependencies from package.json to use as external dependencies
 */
function getExternalDependenciesFromPackageJson(
  packageJson: Record<string, any> | null,
): string[] {
  if (!packageJson) return [];

  const dependencyTypes = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ] as const;

  return dependencyTypes.flatMap(type => Object.keys(packageJson[type] || {}));
}

/**
 * Gets additional files to copy from package.json files field
 */
function getAdditionalFilesToCopy(
  packageJson: Record<string, any> | null,
): string[] {
  if (!packageJson?.files || !Array.isArray(packageJson.files)) {
    return [];
  }

  return packageJson.files.filter((file: string) => {
    // Skip negation patterns (starting with !)
    if (file.startsWith('!')) return false;
    // Skip 'src' as it's already handled by the build output
    if (file === 'src') return false;
    // Include specific files (README, LICENSE, etc.)
    return !file.includes('*') && !file.includes('/');
  });
}

/**
 * Copies a file, creating directories as needed
 */
async function safeCopyFile(
  sourcePath: string,
  destPath: string,
  fileName: string,
): Promise<void> {
  try {
    await mkdir(dirname(destPath), { recursive: true });
    await copyFile(sourcePath, destPath);
  } catch (error) {
    console.warn(`Failed to copy ${fileName}:`, error);
  }
}

/**
 * Updates package.json paths by removing the dist/ and src/ prefixes
 */
function updatePackageJsonPaths(
  packageJson: Record<string, any>,
  hasEsm: boolean,
  hasCjs: boolean,
): void {
  const pathFields = ['main', 'module', 'types', 'typings'] as const;

  for (const field of pathFields) {
    if (packageJson[field]) {
      packageJson[field] = packageJson[field]
        .replace(/^(\.\/)?dist\//, './')
        .replace(/^(\.\/)?src\//, './');
      // Only adjust main to .cjs for CJS-only builds
      if (field === 'main' && hasCjs && !hasEsm) {
        packageJson[field] = packageJson[field].replace(/\.js$/, '.cjs');
      }
    }
  }
}

/**
 * Updates bin field with correct extensions and paths
 */
function updateBinField(
  packageJson: Record<string, any>,
  hasEsm: boolean,
): void {
  if (!packageJson.bin) return;

  if (typeof packageJson.bin === 'string') {
    packageJson.bin = packageJson.bin
      .replace(/^(\.\/)?dist\//, './')
      .replace(/^(\.\/)?src\//, './')
      .replace(/\.js$/, hasEsm ? '.js' : '.cjs');
  } else {
    packageJson.bin = Object.fromEntries(
      Object.entries(packageJson.bin).map(([name, path]) => [
        name,
        (path as string)
          .replace(/^(\.\/)?dist\//, './')
          .replace(/^(\.\/)?src\//, './')
          .replace(/\.js$/, hasEsm ? '.js' : '.cjs'),
      ]),
    );
  }
}

/**
 * Creates an export entry with the appropriate import/require/types fields
 */
function createExportEntry(
  path: string,
  hasEsm: boolean,
  hasCjs: boolean,
): Record<string, string> {
  const entry: Record<string, string> = {};

  if (hasEsm) {
    entry.import = path.replace(/\.(cjs|mjs)$/, '.js');
  }
  if (hasCjs) {
    entry.require = path.replace(/\.(js|mjs)$/, '.cjs');
  }
  entry.types = path.replace(/\.(c|m)?js$/, '.d.ts');

  return entry;
}

/**
 * Generates exports field based on build format
 */
function generateExportsField(
  hasEsm: boolean,
  hasCjs: boolean,
): Record<string, any> {
  const exportPatterns = {
    '.': './index.js',
    './*': './*/index.js',
    './*/': './*/index.js',
    './*.js': './*.js',
  };

  return Object.fromEntries(
    Object.entries(exportPatterns).map(([key, path]) => [
      key,
      createExportEntry(path, hasEsm, hasCjs),
    ]),
  );
}

export interface BaseConfigOptions {
  projectRoot: string;
  /**
   * Entry point pattern or file path. Can be:
   * - A string for a single entry point
   * - An array of strings for multiple entry points
   * - An object mapping entry names to file paths
   * @default `${projectRoot}/src/index.ts`
   */
  entry?: string | string[] | Record<string, string>;
  /**
   * Root directory for preserving module structure
   * @default 'src'
   */
  preserveModulesRoot?: string;
  /**
   * Output directory
   * @default `${projectRoot}/dist`
   */
  outDir?: string;
  /**
   * Additional external dependencies beyond those in package.json
   * @default []
   */
  additionalExternals?: string[];
  /**
   * Build formats
   * @default ['es']
   */
  formats?: Array<'es' | 'cjs'>;
  /**
   * Enable sourcemaps
   * @default true
   */
  sourcemap?: boolean;
}

export function baseConfig(options: BaseConfigOptions): RolldownOptions {
  const {
    projectRoot,
    entry = `${projectRoot}/src/index.ts`,
    preserveModulesRoot = 'src',
    outDir = `${projectRoot}/dist`,
    additionalExternals = [],
    formats = ['es'],
    sourcemap = true,
  } = options;

  // Read package.json to get dependencies and additional files to copy
  const packageJsonPath = join(projectRoot, 'package.json');
  const packageJson = readPackageJson(packageJsonPath);

  const externalDeps = getExternalDependenciesFromPackageJson(packageJson);
  const additionalCopyFiles = getAdditionalFilesToCopy(packageJson);

  // Always mark node_modules as external to avoid bundling dependencies
  const external = [
    ...new Set([...externalDeps, ...additionalExternals]),
    /node_modules/,
  ];

  // Create output configurations for each format
  const formatExtensions = { es: '.js', cjs: '.cjs' } as const;

  const outputs: OutputOptions[] = formats.map(format => {
    const ext = formatExtensions[format];
    return {
      dir: outDir,
      format,
      sourcemap,
      preserveModules: true,
      preserveModulesRoot,
      entryFileNames: `[name]${ext}`,
      chunkFileNames: `[name]${ext}`,
    };
  });

  return defineConfig({
    input: entry,
    output: outputs.length > 0 ? outputs : undefined,
    external,
    plugins: [
      // Plugin to transform relative paths to package.json
      {
        name: 'transform-package-json-paths',
        transform(code, id) {
          // Transform relative paths to package.json by removing one ../ level
          // This is needed because we build to dist/ instead of dist/src/
          if (code.includes('package.json')) {
            // Match any number of ../ and reduce by one level
            return code.replace(
              /(['"`])((?:\.\.\/)+)(package\.json)\1/g,
              (match, quote, dots, file) => {
                // Remove one ../ from the path
                const newDots = dots.replace(/\.\.\//, '');
                return `${quote}${newDots}${file}${quote}`;
              },
            );
          }
          return null;
        },
      },
      // Custom plugin to copy files and modify package.json after build
      {
        name: 'copy-files-and-update-package-json',
        async closeBundle() {
          // Ensure output directory exists
          await mkdir(outDir, { recursive: true });

          // Copy standard files and additional files to dist root
          const filesToCopy = [
            'package.json',
            'README.md',
            ...additionalCopyFiles,
          ];

          await Promise.all(
            filesToCopy.map(file =>
              safeCopyFile(join(projectRoot, file), join(outDir, file), file),
            ),
          );

          // Update package.json in dist
          const distPackageJsonPath = join(outDir, 'package.json');
          try {
            const packageJson = JSON.parse(
              await readFile(distPackageJsonPath, 'utf8'),
            );

            // Remove fields not needed in published package
            const fieldsToRemove = [
              'devDependencies',
              'scripts',
              'nx',
            ] as const;
            fieldsToRemove.forEach(field => delete packageJson[field]);

            // Remove files field to include all built output
            // (npm will include everything in dist except what's in .npmignore)
            delete packageJson.files;

            // Detect which formats were built
            const hasEsm = formats.includes('es');
            const hasCjs = formats.includes('cjs');

            // Update paths, bin field, and exports
            updatePackageJsonPaths(packageJson, hasEsm, hasCjs);
            updateBinField(packageJson, hasEsm);
            packageJson.exports = generateExportsField(hasEsm, hasCjs);

            await writeFile(
              distPackageJsonPath,
              JSON.stringify(packageJson, null, 2) + '\n',
              'utf8',
            );
          } catch (error) {
            // If package.json doesn't exist in dist, skip modification
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
              console.error('Failed to update package.json:', error);
            }
          }
        },
      },
    ],
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
    return getExternalDependenciesFromPackageJson(packageJson);
  } catch {
    // No package.json or unable to read it - return empty array
    return [];
  }
}
