import { createJiti as createJitiSource } from 'jiti';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import type { CompilerOptions } from 'typescript';
import { fileExists } from './file-system.js';
import { loadTargetConfig } from './load-ts-config.js';
import { settlePromise } from './promises.js';

// For unknown reason, we can't import `JitiOptions` directly in this repository
type JitiOptions = Exclude<Parameters<typeof createJitiSource>[1], undefined>;

export type ImportModuleOptions = JitiOptions & {
  filepath: string;
  tsconfig?: string;
};
export async function importModule<T = unknown>(
  options: ImportModuleOptions,
): Promise<T> {
  const { filepath, tsconfig, ...jitiOptions } = options;

  if (!filepath) {
    throw new Error(
      `Importing module failed. File '${filepath}' does not exist`,
    );
  }

  const absoluteFilePath = path.resolve(process.cwd(), filepath);
  const resolvedStats = await settlePromise(stat(absoluteFilePath));
  if (resolvedStats.status === 'rejected') {
    throw new Error(`File '${absoluteFilePath}' does not exist`);
  }
  if (!resolvedStats.value.isFile()) {
    throw new Error(`Expected '${filepath}' to be a file`);
  }

  const jitiInstance = await createTsJiti(import.meta.url, {
    ...jitiOptions,
    tsconfigPath: tsconfig,
  });

  return (await jitiInstance.import(absoluteFilePath, { default: true })) as T;
}

/**
 * Converts TypeScript paths configuration to jiti alias format
 * @param paths TypeScript paths object from compiler options
 * @param baseUrl Base URL for resolving relative paths
 * @returns Jiti alias object with absolute paths
 */
export function mapTsPathsToJitiAlias(
  paths: Record<string, string[]>,
  baseUrl: string,
): Record<string, string> {
  return Object.entries(paths).reduce(
    (aliases, [pathPattern, pathMappings]) => {
      if (!Array.isArray(pathMappings) || pathMappings.length === 0) {
        return aliases;
      }
      // Jiti does not support overloads (multiple mappings for the same path pattern)
      if (pathMappings.length > 1) {
        throw new Error(
          `TypeScript path overloads are not supported by jiti. Path pattern '${pathPattern}' has ${pathMappings.length} mappings: ${pathMappings.join(', ')}. Jiti only supports a single alias mapping per pattern.`,
        );
      }
      const aliasKey = pathPattern.replace(/\/\*$/, '');
      const aliasValue = (pathMappings.at(0) as string).replace(/\/\*$/, '');
      return {
        ...aliases,
        [aliasKey]: path.isAbsolute(aliasValue)
          ? aliasValue
          : path.resolve(baseUrl, aliasValue),
      };
    },
    {} satisfies Record<string, string>,
  );
}

/**
 * Maps TypeScript JSX emit mode to Jiti JSX boolean option
 * @param tsJsxMode TypeScript JsxEmit enum value (0-5)
 * @returns true if JSX processing should be enabled, false otherwise
 */
export const mapTsJsxToJitiJsx = (tsJsxMode: number): boolean =>
  tsJsxMode !== 0;

/**
 * Possible TS to jiti options mapping
 * | Jiti Option       | Jiti Type               | TS Option              | TS Type                  | Description |
 * |-------------------|-------------------------|-----------------------|--------------------------|-------------|
 * | alias             | Record<string, string> | paths                 | Record<string, string[]> | Module path aliases for module resolution. |
 * | interopDefault    | boolean                 | esModuleInterop       | boolean                  | Enable default import interop. |
 * | sourceMaps        | boolean                 | sourceMap             | boolean                  | Enable sourcemap generation. |
 * | jsx               | boolean                 | jsx                   | JsxEmit (0-5)           | TS JsxEmit enum (0-5) => boolean JSX processing. |
 */
export type MappableJitiOptions = Partial<
  Pick<JitiOptions, 'alias' | 'interopDefault' | 'sourceMaps' | 'jsx'>
>;
/**
 * Parse TypeScript compiler options to mappable jiti options
 * @param compilerOptions TypeScript compiler options
 * @param tsconfigDir Directory of the tsconfig file (for resolving relative baseUrl)
 * @returns Mappable jiti options
 */
export function parseTsConfigToJitiConfig(
  compilerOptions: CompilerOptions,
  tsconfigDir?: string,
): MappableJitiOptions {
  const paths = compilerOptions.paths || {};
  const baseUrl = compilerOptions.baseUrl
    ? path.isAbsolute(compilerOptions.baseUrl)
      ? compilerOptions.baseUrl
      : tsconfigDir
        ? path.resolve(tsconfigDir, compilerOptions.baseUrl)
        : path.resolve(process.cwd(), compilerOptions.baseUrl)
    : tsconfigDir || process.cwd();

  return {
    ...(Object.keys(paths).length > 0
      ? {
          alias: mapTsPathsToJitiAlias(paths, baseUrl),
        }
      : {}),
    ...(compilerOptions.esModuleInterop == null
      ? {}
      : { interopDefault: compilerOptions.esModuleInterop }),
    ...(compilerOptions.sourceMap == null
      ? {}
      : { sourceMaps: compilerOptions.sourceMap }),
    ...(compilerOptions.jsx == null
      ? {}
      : { jsx: mapTsJsxToJitiJsx(compilerOptions.jsx) }),
  };
}

/**
 * Create a jiti instance with options derived from tsconfig.
 * Used instead of direct jiti.createJiti to allow tsconfig integration.
 * @param id
 * @param options
 * @param jiti
 */
export async function createTsJiti(
  id: string,
  options: JitiOptions & { tsconfigPath?: string } = {},
  createJiti: (typeof import('jiti'))['createJiti'] = createJitiSource,
) {
  const { tsconfigPath, ...jitiOptions } = options;

  const fallbackTsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');

  const validPath: null | string =
    tsconfigPath == null
      ? (await fileExists(fallbackTsconfigPath))
        ? fallbackTsconfigPath
        : null
      : path.resolve(process.cwd(), tsconfigPath);

  const tsDerivedJitiOptions: MappableJitiOptions = validPath
    ? await jitiOptionsFromTsConfig(validPath)
    : {};

  return createJiti(id, { ...jitiOptions, ...tsDerivedJitiOptions });
}

/**
 * Read tsconfig file and parse options to jiti options
 * @param tsconfigPath
 */
export async function jitiOptionsFromTsConfig(
  tsconfigPath: string,
): Promise<MappableJitiOptions> {
  const { options } = loadTargetConfig(tsconfigPath);
  return parseTsConfigToJitiConfig(options, path.dirname(tsconfigPath));
}
