import { type JitiOptions, createJiti as createJitiSource } from 'jiti';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import type { CompilerOptions } from 'typescript';
import { fileExists } from './file-system.js';
import { loadTargetConfig } from './load-ts-config.js';
import { settlePromise } from './promises.js';

export async function importModule<T = unknown>(
  options: JitiOptions & { filepath: string; tsconfig?: string },
): Promise<T> {
  const { filepath, tsconfig, ...jitiOptions } = options;

  const resolvedStats = await settlePromise(stat(options.filepath));
  if (resolvedStats.status === 'rejected') {
    throw new Error(`File '${options.filepath}' does not exist`);
  }
  if (!resolvedStats.value.isFile()) {
    throw new Error(`Expected '${options.filepath}' to be a file`);
  }

  const jitiInstance = await createTsJiti(options.filepath, {
    ...jitiOptions,
    tsconfigPath: options.tsconfig,
  });
  return (await jitiInstance.import(filepath, { default: true })) as T;
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
export type MappableJitiOptions = Partial<{
  alias: Record<string, string>;
  interopDefault: boolean;
  sourceMaps: boolean;
  jsx: boolean;
}>;
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
 * @param filepath
 * @param options
 * @param jiti
 */
export async function createTsJiti(
  filepath: string,
  options: JitiOptions & { tsconfigPath?: string },
  createJiti: (typeof import('jiti'))['createJiti'] = createJitiSource,
) {
  const { tsconfigPath, ...jitiOptions } = options;
  const fallbackTsconfigPath = path.resolve('./tsconfig.json');

  const validPath: null | string =
    tsconfigPath == null
      ? (await fileExists(fallbackTsconfigPath))
        ? fallbackTsconfigPath
        : null
      : tsconfigPath;

  const tsDerivedJitiOptions: MappableJitiOptions = validPath
    ? await jitiOptionsFromTsConfig(validPath)
    : {};
  return createJiti(filepath, { ...jitiOptions, ...tsDerivedJitiOptions });
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
