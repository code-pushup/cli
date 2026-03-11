# Mocks

## multiprocess-profiling

The `profiler-worker.mjs` script demonstrates multiprocess profiling by spawning N child processes that perform work and generate performance traces.

### Expected Output

**Console:**

- JSON object containing profiler statistics (profiler state, shard info, queue stats, etc.)

**Files:**

- A timestamped directory in `CP_PROFILER_OUT_DIR` (e.g., `20260131-210017-052/`)
  - `trace.<timestamp>.<pid>.<shard>.jsonl` - WAL format trace files (one per process)
  - `trace.<timestamp>.json` - Consolidated trace file in Chrome DevTools format

### Usage

```bash
CP_PROFILING=true DEBUG=true CP_PROFILER_OUT_DIR=/path/to/output npx tsx packages/utils/mocks/multiprocess-profiling/profiler-worker.mjs <numProcesses>
```

**Example:**

```bash
 CP_PROFILING=true DEBUG=true CP_PROFILER_OUT_DIR=./tmp/int/utils npx tsx --tsconfig tsconfig.base.json packages/utils/mocks/multiprocess-profiling/profiler-worker.mjs 3
```
