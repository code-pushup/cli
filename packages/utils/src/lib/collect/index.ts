import {
  CoreConfig,
  GlobalCliArgs,
  PluginReport,
  Report,
} from '@quality-metrics/models';
import { executePlugins } from './implementation/execute-plugin';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

/**
 * Error thrown when collect output is invalid.
 */
export class CollectOutputError extends Error {
  constructor(pluginSlug: string, error?: Error) {
    super(
      `Runner output from collect command is invalid. \n Zod Error: ${error?.message}`,
    );
    if (error) {
      this.name = error.name;
      this.stack = error.stack;
    }
  }
}

export type CollectOptions = GlobalCliArgs & CoreConfig;

/**
 * Run audits, collect plugin output and aggregate it into a JSON object
 * @param options
 */
export async function collect(options: CollectOptions): Promise<Report> {
  const { version, name } = await readPackageJson();
  const { plugins } = options;

  if (!plugins?.length) {
    throw new Error('No plugins registered');
  }

  const date = new Date().toISOString();
  performance.mark('startExecutePlugins');
  const runnerOutputs = await executePlugins(plugins);
  performance.mark('stopExecutePlugins');
  const { duration } = performance.measure(
    'startExecutePlugins',
    'stopExecutePlugins',
  );

  return {
    package: name,
    version,
    date,
    duration,
    plugins: runnerOutputs.map((pluginOutput): PluginReport => {
      const pluginConfig = plugins.find(
        plugin => plugin.meta.slug === pluginOutput.slug,
      );
      // shouldn't happen, validation checks it
      if (!pluginConfig) {
        throw new Error(
          `Plugin config not found for slug ${pluginOutput.slug}`,
        );
      }
      return {
        date: pluginOutput.date,
        duration: pluginOutput.duration,
        meta: pluginConfig.meta,
        audits: pluginOutput.audits.map(audit => {
          const auditMetadata = pluginConfig.audits.find(
            ({ slug }) => slug === audit.slug,
          );
          // shouldn't happen, validation checks it
          if (!auditMetadata) {
            throw new Error(`Audit metadata not found for slug ${audit.slug}`);
          }
          return {
            ...auditMetadata,
            ...audit,
          };
        }),
      };
    }),
  };
}

export class ReadPackageJsonError extends Error {
  constructor(message: string) {
    super(`error reading package.json: ${message}`);
  }
}

export async function readPackageJson() {
  try {
    const filepath = join(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
      '..',
      '..',
      'cli',
      'package.json',
    );
    return JSON.parse(readFileSync(filepath).toString()) as {
      name: string;
      version: string;
    };
  } catch (e) {
    throw new ReadPackageJsonError((e as { message: string }).message);
  }
}
