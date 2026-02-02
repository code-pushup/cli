import { coreConfigMiddleware } from '../src/lib/implementation/core-config.middleware.js';

// Suppress all console output except our JSON
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

process.stdout.write = () => true;
process.stderr.write = () => true;

const CLI_DEFAULTS = {
  plugins: [],
  onlyPlugins: [],
  skipPlugins: [],
};

const configPath = process.argv[2];
if (!configPath) {
  process.stderr.write = originalStderrWrite;
  process.stderr.write('Error: Config path argument is required\n');
  process.exit(1);
}

const tsconfigPath = process.argv[3];

const result = await coreConfigMiddleware({
  config: configPath, // relative path from cwd
  ...(tsconfigPath ? { tsconfig: tsconfigPath } : {}),
  // If no tsconfig provided, should fallback to ./tsconfig.json
  ...CLI_DEFAULTS,
});

// Restore stdout and stderr, then write only JSON
process.stdout.write = originalStdoutWrite;
process.stderr.write = originalStderrWrite;
process.stdout.write(JSON.stringify({ success: true, config: result.config }));
