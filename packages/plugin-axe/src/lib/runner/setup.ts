import path from 'node:path';
import type { Page } from 'playwright-core';
import { z } from 'zod/v4';
import {
  convertAsyncZodFunctionToSchema,
  validateAsync,
} from '@code-pushup/models';
import { fileExists, logger } from '@code-pushup/utils';

const setupFunctionSchema = convertAsyncZodFunctionToSchema(
  z.function({
    input: [z.custom<Page>(val => val != null && typeof val === 'object')],
    output: z.void(),
  }),
).meta({
  title: 'SetupFunction',
  description: 'Async function that authenticates using a Playwright Page',
});
export type SetupFunction = z.infer<typeof setupFunctionSchema>;

const setupScriptModuleSchema = z
  .object({ default: setupFunctionSchema })
  .meta({
    title: 'SetupScriptModule',
    description:
      'ES module with a default export containing the authentication setup function',
  });

/** Loads and validates a setup script module from the given path. */
export async function loadSetupScript(
  setupScript: string,
): Promise<SetupFunction> {
  const absolutePath = path.isAbsolute(setupScript)
    ? setupScript
    : path.join(process.cwd(), setupScript);

  if (!(await fileExists(absolutePath))) {
    throw new Error(`Setup script not found: ${absolutePath}`);
  }

  const validModule = await logger.task(
    `Loading setup script from ${absolutePath}`,
    async () => {
      const module: unknown = await import(absolutePath);
      const validated = await validateAsync(setupScriptModuleSchema, module, {
        filePath: absolutePath,
      });
      return { message: 'Setup script loaded successfully', result: validated };
    },
  );

  return validModule.default;
}

/** Executes the setup function with the provided Playwright page. */
export async function runSetup(
  setupFn: SetupFunction,
  page: Page,
): Promise<void> {
  await logger.task('Running authentication setup script', async () => {
    await setupFn(page);
    return { message: 'Authentication setup completed', result: undefined };
  });
}
