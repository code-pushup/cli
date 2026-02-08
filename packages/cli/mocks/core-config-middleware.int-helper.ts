#!/usr/bin/env node

/**
 * Helper script for testing coreConfigMiddleware with tsconfig path resolution.
 * This script is executed in a subprocess to test the middleware in isolation.
 *
 * Usage: tsx core-config-middleware.int-helper.ts <configPath> [tsconfigPath]
 *
 * Note: Logger output is redirected to stderr to avoid interfering with JSON output on stdout.
 */
import { coreConfigMiddleware } from '../src/lib/implementation/core-config.middleware.js';

// Redirect console.log and process.stdout.write to stderr to prevent logger output
// from interfering with JSON output
const originalLog = console.log;
const originalWrite = process.stdout.write.bind(process.stdout);

console.log = (...args: unknown[]) => {
  process.stderr.write(args.join(' ') + '\n');
};

process.stdout.write = ((chunk: any, ...args: any[]): boolean => {
  return process.stderr.write(chunk, ...args);
}) as typeof process.stdout.write;

const [configPath, tsconfigPath] = process.argv.slice(2);

if (!configPath) {
  console.error('Error: configPath is required');
  process.exit(1);
}

try {
  const result = await coreConfigMiddleware({
    config: configPath,
    ...(tsconfigPath && { tsconfig: tsconfigPath }),
    plugins: [],
    onlyPlugins: [],
    skipPlugins: [],
  });

  // Restore original stdout.write before outputting JSON
  process.stdout.write = originalWrite;

  // Use originalLog to write JSON to stdout
  originalLog(
    JSON.stringify({
      success: true,
      config: result.config,
    }),
  );
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
