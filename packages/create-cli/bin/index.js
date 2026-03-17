#!/usr/bin/env node

/**
 * This file serves as the CLI entry point.
 *
 * We use a separate bin file (instead of pointing directly to src/index.js)
 * because TypeScript build processes don't preserve file permissions.
 * By tracking this file in git with executable permissions (+x), we ensure
 * the CLI remains executable after npm publish without needing post-install scripts.
 */
import '../src/index.js';
