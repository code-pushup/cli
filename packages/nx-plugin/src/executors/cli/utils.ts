import type { CliExecutorOptions } from './schema.js';

/**
 * Deeply merges executor options.
 *
 * @param targetOptions - The original options from the target configuration.
 * @param cliOptions - The options from Nx, combining target options and CLI arguments.
 * @returns A new object with deeply merged properties.
 *
 * Nx performs a shallow merge by default, where command-line arguments can override entire objects
 * (e.g., `--persist.filename` replaces the entire `persist` object).
 * This function ensures that nested properties are deeply merged,
 * preserving the original target options where CLI arguments are not provided.
 */
export function mergeExecutorOptions(
  targetOptions: Partial<CliExecutorOptions>,
  cliOptions: Partial<CliExecutorOptions>,
): CliExecutorOptions {
  return {
    ...targetOptions,
    ...cliOptions,
    ...(targetOptions?.persist || cliOptions?.persist
      ? {
          persist: {
            outputDir: '.code-pushup',
            ...targetOptions?.persist,
            ...cliOptions?.persist,
          },
        }
      : {}),
    ...(targetOptions?.upload || cliOptions?.upload
      ? {
          upload: {
            ...targetOptions?.upload,
            ...cliOptions?.upload,
          },
        }
      : {}),
  };
}
