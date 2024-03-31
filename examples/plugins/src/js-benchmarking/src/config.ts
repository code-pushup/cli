import {z} from 'zod';
import {JS_BENCHMARKING_DEFAULT_RUNNER_PATH} from "./constants";

export const jsBenchmarkingPluginConfigSchema = z.object({
  targets: z.array(z.string()),
  runnerPath: z.string().default(JS_BENCHMARKING_DEFAULT_RUNNER_PATH),
  tsconfig: z.string().optional(),
  outputDir: z.string().optional(),
  verbose: z.boolean().optional()
});
export type JsBenchmarkingPluginConfig = z.input<typeof jsBenchmarkingPluginConfigSchema>;
