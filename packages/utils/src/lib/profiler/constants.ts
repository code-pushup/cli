/**
 * Environment variable name for enabling/disabling profiling globally.
 * When set to 'true', profiling is enabled. When set to 'false' or unset, profiling is disabled.
 *
 * @example
 * CP_PROFILING=true npm run dev
 */
export const PROFILER_ENABLED_ENV_VAR = 'CP_PROFILING';

/**
 * Environment variable name for enabling debug mode for profiler state transitions.
 * When set to 'true', profiler state transitions create performance marks for debugging.
 *
 * @example
 * DEBUG=true npm run dev
 */
export const PROFILER_DEBUG_ENV_VAR = 'DEBUG';

/**
 * Environment variable name for setting the Sharded WAL Coordinator ID.
 * This ID is used to identify the coordinator instance in a sharded Write-Ahead Logging setup.
 *
 * @example
 * CP_SHARDED_WAL_COORDINATOR_ID=coordinator-1 npm run dev
 */
export const SHARDED_WAL_COORDINATOR_ID_ENV_VAR =
  'CP_SHARDED_WAL_COORDINATOR_ID';

/**
 * Default output directory for persisted profiler data.
 * Matches the default persist output directory from models.
 */
export const PROFILER_PERSIST_OUT_DIR = 'tmp/profiles';

/**
 * Environment variable name for setting the output directory for profiler data.
 * When set, profiler data is written to the specified directory.
 *
 * @example
 * CP_PROFILER_OUT_DIR=/path/to/output npm run dev
 */
export const PROFILER_OUT_DIR_ENV_VAR = 'CP_PROFILER_OUT_DIR';

/**
 * Environment variable name for setting the measure name for profiler data.
 * When set, the measure name is used to identify the profiler data.
 */
export const PROFILER_MEASURE_NAME_ENV_VAR = 'CP_PROFILER_MEASURE_NAME';
/**
 * Default filename (without extension) for persisted profiler data.
 * Matches the default persist filename from models.
 */
export const PROFILER_OUT_FILENAME = 'report';

/**
 * Default base name for WAL files.
 * Used as the base name for sharded WAL files (e.g., "trace").
 */
export const PROFILER_OUT_BASENAME = 'trace';

/**
 * Default base name for WAL files.
 * Used as the base name for sharded WAL files (e.g., "trace").
 */
export const PROFILER_DEBUG_MEASURE_PREFIX = 'debug';
