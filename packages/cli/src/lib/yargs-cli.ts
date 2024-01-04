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
export function yargsCli<T = unknown>(
  argv: string[],
  cfg: {
    usageMessage?: string;
    scriptName?: string;
    commands?: CommandModule[];
    options?: { [key: string]: Options };
    middlewares?: {
      middlewareFunction: unknown;
      applyBeforeValidation?: boolean;
    }[];
    noExitProcess?: boolean;
  },
): Argv<T> {
  const { usageMessage, scriptName, noExitProcess } = cfg;
  let { commands, options, middlewares } = cfg;
  commands = Array.isArray(commands) ? commands : [];
  middlewares = Array.isArray(middlewares) ? middlewares : [];
  options = options || {};
  const cli = yargs(argv);

  // setup yargs
  cli
    .help()
    .version(false)
    .alias('h', 'help')
    .parserConfiguration({
      'strip-dashed': true,
    } satisfies Partial<ParserConfigurationOptions>)
    .array('persist.format')
    .coerce('config', (config: string | string[]) => {
      if (Array.isArray(config)) {
        return config[config.length - 1];
      }
      return config;
    })
    .options(options)
    // take full width of the terminal `cli.terminalWidth()`
    .wrap(150);
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
      logErrorBeforeThrow(middlewareFunction as MiddlewareFunction),
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

  // this flag should be set for tests and debugging purposes
  // when there is an error and exitProcess is called, it suppresses the error message
  // more info here: https://yargs.js.org/docs/#api-reference-exitprocessenable
  if (noExitProcess) {
    cli.exitProcess(false);
  }

  // return CLI object
  return cli as unknown as Argv<T>;
}
