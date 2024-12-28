import type {TypescriptPluginOptions} from "./types.js";
import {loadTargetConfig, loadTsConfigDefaultsByVersion} from "./runner/utils.js";
import type {CompilerOptions} from "typescript";
import {TS_ERROR_CODES} from "./runner/ts-error-codes.js";

/**
 * It will evaluate if the option strict is enabled. If so, it must enable all it's dependencies.
 * [Logic Reference](https://github.com/microsoft/TypeScript/blob/56a08250f3516b3f5bc120d6c7ab4450a9a69352/src/compiler/utilities.ts#L9262)
 * @param options Current compiler options
 * @returns CompilerOptions evaluated.
 */
export function handleCompilerOptionStrict(options: CompilerOptions) {
  if (!options.strict) {
    return options;
  }

  const strictOptions = Object.fromEntries(
    Object.keys(TS_ERROR_CODES.strict).map(key => [key, true]),
  ) as CompilerOptions;

  return {
    ...options,
    ...strictOptions,
  };
}

/**
 * It will from the options, and the TS Version, get a final compiler options to be used later for filters
 * Once it's processed for the first time, it will store the information in a variable, to be retrieve
 * later if existing
 * @param options Plugin options
 */
export async function normalizeCompilerOptions(
  options: Required<Pick<TypescriptPluginOptions, 'tsConfigPath'>>,
) {
  const {tsConfigPath} = options;
  const {compilerOptions: defaultCompilerOptions} =
    await loadTsConfigDefaultsByVersion();
  const {options: targetCompilerOptions} = await loadTargetConfig(tsConfigPath);
  return handleCompilerOptionStrict({
    ...defaultCompilerOptions,
    ...targetCompilerOptions,
  });
}
