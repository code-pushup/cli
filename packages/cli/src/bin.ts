#! /usr/bin/env node
import { hideBin } from 'yargs/helpers';
import { yargsCli } from './lib/cli';
import { yargsGlobalOptionsDefinition } from './lib/options';
import { middlewares } from './lib/middlewares';
import { commands } from './lib/commands';

// bootstrap yargs; format arguments
yargsCli(
  // hide first 2 args from process
  hideBin(process.argv),
  {
    usageMessage: 'CPU CLI',
    scriptName: 'cpu',
    options: yargsGlobalOptionsDefinition(),
    middlewares,
    commands,
  },
).argv;
