import { glob } from 'glob';
import * as path from 'node:path';
import { z } from 'zod';
import type { BaselineConfig } from '../../baseline/baseline.json';

// Zod schema to validate TsBase shape
const tsBaseSchema = z.object({
  sync: z.function(),
  tags: z.array(z.string()).optional(),
  formatter: z.any().optional(), // DiagnosticFormatter is complex, using any for now
  filePath: z.string().optional(),
  matcher: z.union([z.string(), z.array(z.string())]).optional(),
});

/**
 * Returns baseline configurations loaded from baseline rc files.
 *
 * @returns Array of baseline configurations
 */
export async function loadBaselineRc(): Promise<BaselineConfig[]> {
  const baselineDir =
    process.env.BASELINE_DIR || path.join(__dirname, '../../../../baseline');

  // Find all files ending with baseline.ts in the baseline directory
  const baselineFiles = await glob('**/*baseline.ts', {
    cwd: baselineDir,
    absolute: true,
  });

  const baselines: BaselineConfig[] = [];

  // Dynamically import and validate each baseline file
  for (const filePath of baselineFiles) {
    try {
      const module = await import(filePath);

      // Load default export from the module
      if (module.default) {
        const result = tsBaseSchema.safeParse(module.default);
        if (result.success) {
          baselines.push(result.data as BaselineConfig);
        } else {
          console.warn(
            `Invalid baseline default export in ${filePath}:`,
            result.error.message,
          );
        }
      } else {
        console.warn(
          `Baseline file ${filePath} does not have a default export`,
        );
      }
    } catch (error) {
      console.warn(`Failed to load baseline file ${filePath}:`, error);
    }
  }

  return baselines;
}
