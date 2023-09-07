import yargs, {Argv, CommandModule, MiddlewareFunction, Options, ParserConfigurationOptions,} from 'yargs';
import chalk from 'chalk';

/**
 * returns configurable yargs cli for code-pushup
 *
 * @example
 * yargsCli(hideBin(process.argv))
 *   // bootstrap CLI; format arguments
 *   .argv;
 */
export function yargsCli<T>(argv: string[], cfg: {
  usageMessage?: string;
  scriptName?: string;
  commands?: CommandModule[];
  options?: { [key: string]: Options };
  middlewares?: {
    middlewareFunction: MiddlewareFunction;
    applyBeforeValidation?: boolean;
  }[];
}): Argv<T> {
  const { usageMessage, scriptName } = cfg;
  let { commands, options, middlewares } = cfg;
  commands = Array.isArray(commands) ? commands : [];
  middlewares = Array.isArray(middlewares) ? middlewares : [];
  options = options || {};
  const cli = yargs(argv);

  // setup yargs
  cli
    .parserConfiguration({
      'strip-dashed': true,
    } satisfies Partial<ParserConfigurationOptions>)
    .options(options)
   .demandCommand(1, 'Minimum 1 command!')

  if(usageMessage) {
    cli.usage(chalk.bold(usageMessage))
  }
  if(scriptName) {
    cli.scriptName(scriptName)
  }

  // add middlewares
  middlewares.forEach(({ middlewareFunction, applyBeforeValidation }) =>
    cli.middleware(middlewareFunction, applyBeforeValidation),
  );

  // add commands
  commands.forEach(commandObj => cli.command(commandObj));

  // return CLI object
  return cli as Argv<T>;
}
