#!/usr/bin/env npx tsx
import { main } from './cli.js';

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
