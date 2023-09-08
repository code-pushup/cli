import { CoreConfig } from '@quality-metrics/models';
import chalk from 'chalk';
import yargs, {
  Argv,
  CommandModule,
  MiddlewareFunction,
  Options,
  ParserConfigurationOptions,
} from 'yargs';
import { logErrorBeforeThrow } from './implementation/utils';

/**
 * returns configurable yargs CLI for code-pushup
 *
 * @example
 * yargsCli(hideBin(process.argv))
 *   // bootstrap CLI; format arguments
 *   .argv;
 */
export function yargsCli(
  argv: string[],
  cfg: {
    usageMessage?: string;
    scriptName?: string;
    commands?: CommandModule[];
    demandCommand?: [number, string];
    options?: { [key: string]: Options };
    middlewares?: {
      middlewareFunction: MiddlewareFunction;
      applyBeforeValidation?: boolean;
    }[];
  },
): Argv<CoreConfig> {
  const { usageMessage, scriptName } = cfg;
  let { commands, options, middlewares /*demandCommand*/ } = cfg;
  // demandCommand = Array.isArray(demandCommand) ? demandCommand: [1, 'Minimum 1 command!'];
  commands = Array.isArray(commands) ? commands : [];
  middlewares = Array.isArray(middlewares) ? middlewares : [];
  options = options || {};
  const cli = yargs(argv);

  // setup yargs
  cli
    .help()
    .alias('h', 'help')
    .parserConfiguration({
      'strip-dashed': true,
    } satisfies Partial<ParserConfigurationOptions>)
    .options(options);
  //.demandCommand(...demandCommand);

  // usage message
  if (usageMessage) {
    cli.usage(chalk.bold(usageMessage));
  }

  // script name
  if (scriptName) {
    cli.scriptName(scriptName);
  }

  // add middlewares
  middlewares.forEach(({ middlewareFunction, applyBeforeValidation }) => {
    cli.middleware(
      logErrorBeforeThrow(middlewareFunction),
      applyBeforeValidation,
    );
  });

  // add commands
  commands.forEach(commandObj => {
    cli.command({
      ...commandObj,
      ...(commandObj.handler && {
        handler: logErrorBeforeThrow(commandObj.handler),
      }),
      ...(typeof commandObj.builder === 'function' && {
        builder: logErrorBeforeThrow(commandObj.builder),
      }),
    });
  });

  // return CLI object
  return cli as unknown as Argv<CoreConfig>;
}
