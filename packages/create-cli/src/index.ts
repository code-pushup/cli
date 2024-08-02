#! /usr/bin/env node
import { initCodePushup } from './lib/init';

// eslint-disable-next-line unicorn/prefer-top-level-await
initCodePushup().catch(console.error);
