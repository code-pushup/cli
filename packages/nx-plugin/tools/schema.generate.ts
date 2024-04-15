import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import yargs from 'yargs';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const executorOnlySchema = z.object({
  projectPrefix: z
    .string()
    .describe(
      "Prefix the project name under upload configuration. A '-' is appended automatically E.g. 'cp' => 'cp-<project>'",
    )
    .optional(),
  dryRun: z
    .boolean()
    .describe("Don't execute, just print the produced command")
    .optional(),
});
const globalOptionsSchema = z.object({
  progress: z.boolean().describe('show progress').optional(),
  verbose: z.boolean().describe('additional information').optional(),
});

export const executorSchema = globalOptionsSchema.merge(executorOnlySchema);

export type AutorunCommandExecutor = z.infer<typeof executorSchema>;
export default executorSchema;

const cli = yargs(process.argv).options({
  filename: {
    type: 'string',
    default: 'schema.json',
  },
  outputDir: {
    type: 'string',
    default: 'packages/nx-plugin/src/executors/autorun',
  },
  schemaPath: {
    type: 'string',
    default: 'packages/nx-plugin/src/executors/autorun/schema.ts',
  },
});

(async () => {
  let { filename, outputDir, schemaPath } = await cli.parseAsync();
  console.log(`Run generate schemas for ${schemaPath}`);

  // const { mod: schema } = await bundleRequire({ filepath: schemaPath });

  const jsonSchema = zodToJsonSchema(executorSchema, {
    name: 'CoreConfig',
  });

  const outputPath = join(outputDir, filename);
  console.log(`Generated ${outputPath}`);
  await writeFile(outputPath, JSON.stringify(jsonSchema));
})();
