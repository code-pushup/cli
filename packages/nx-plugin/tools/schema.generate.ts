import { bundleRequire } from 'bundle-require';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import yargs from 'yargs';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { persistConfigSchema, uploadConfigSchema } from '../../models/src';

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

async () => {
  console.log(`Run generate schemas for`);
  let { filename, outputDir, schemaPath } = await cli.parseAsync();

  const { mod: schema } = await bundleRequire({ filepath: schemaPath });

  const jsonSchema = zodToJsonSchema(schema, {
    name: 'CoreConfig',
    target: 'jsonSchema7',
    definitions: {
      persistOptions: persistConfigSchema,
      //   uploadOptions: uploadConfigSchema,
    },
  });

  const outputPath = join(outputDir, filename);
  console.log(`Generated ${outputPath}`);
  await writeFile(outputPath, JSON.stringify(jsonSchema));
};
