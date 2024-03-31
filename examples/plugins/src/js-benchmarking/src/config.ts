import {z} from 'zod';
import {JS_BENCHMARKING_DEFAULT_RUNNER_PATH} from "./constants";

export const jsBenchmarkingPluginConfigSchema = z.object({
  targets: z.array(z.string()),
  runnerPath: z.string().default(JS_BENCHMARKING_DEFAULT_RUNNER_PATH),
  tsconfig: z.string().optional(),
  outputDir: z.string().optional(),
  verbose: z.boolean().optional(),
  perfectScoreThreshold: z
    .number({
      description:
        'Score will be 1 (perfect) for this difference in % and above. Score range is 0 - 1.',
    })
    .gt(0)
    .max(1)
    .optional(),
});
export type JsBenchmarkingPluginConfig = z.input<typeof jsBenchmarkingPluginConfigSchema>;
