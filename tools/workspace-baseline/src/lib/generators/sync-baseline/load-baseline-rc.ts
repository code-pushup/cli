import { glob } from 'glob';
import * as path from 'node:path';
import { z } from 'zod';
import type { TsBase } from '../../baseline.tsconfig';

// Zod schema to validate TsBase shape
const tsBaseSchema = z.object({
  sync: z.function(),
  tags: z.array(z.string()).optional(),
  formatter: z.any().optional(), // DiagnosticFormatter is complex, using any for now
  filePath: z.string().optional(),
});

/**
 * Returns baseline configurations loaded from baseline rc files.
 *
 * @returns Array of baseline configurations
 */
export async function loadBaselineRc(): Promise<TsBase[]> {
  const baselineDir =
    process.env.BASELINE_DIR || path.join(__dirname, '../../../../baseline');

  // Find all files ending with baseline.ts in the baseline directory
  const baselineFiles = await glob('**/*baseline.ts', {
    cwd: baselineDir,
    absolute: true,
  });

  const baselines: TsBase[] = [];

  // Dynamically import and validate each baseline file
  for (const filePath of baselineFiles) {
    try {
      const module = await import(filePath);

      // Check all exports from the module
      for (const [exportName, exportValue] of Object.entries(module)) {
        // Skip non-baseline exports (like imported constants, etc.)
        if (exportName.endsWith('Base')) {
          const result = tsBaseSchema.safeParse(exportValue);
          if (result.success) {
            baselines.push(result.data as TsBase);
          } else {
            console.warn(
              `Invalid baseline export "${exportName}" in ${filePath}:`,
              result.error.message,
            );
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load baseline file ${filePath}:`, error);
    }
  }

  return baselines;
}
