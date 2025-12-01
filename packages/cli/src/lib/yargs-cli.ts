/* eslint-disable max-lines-per-function */
import ansis from 'ansis';
import { createRequire } from 'node:module';
import yargs, {
  type Argv,
  type CommandModule,
  type MiddlewareFunction,
  type Options,
  type ParserConfigurationOptions,
} from 'yargs';
import {
  type PersistConfig,
  formatSchema,
  validate,
} from '@code-pushup/models';
import { TERMINAL_WIDTH } from '@code-pushup/utils';
import {
  descriptionStyle,
  formatNestedValues,
  formatObjectValue,
  headerStyle,
  titleStyle,
} from './implementation/formatting.js';
import { logErrorBeforeThrow } from './implementation/global.utils.js';

export const yargsDecorator = {
  'Commands:': `${ansis.green('Commands')}:`,
  'Options:': `${ansis.green('Options')}:`,
  'Examples:': `${ansis.green('Examples')}:`,
  boolean: ansis.blue('boolean'),
  count: ansis.blue('count'),
  string: ansis.blue('string'),
  array: ansis.blue('array'),
  required: ansis.blue('required'),
  'default:': `${ansis.blue('default')}:`,
  'choices:': `${ansis.blue('choices')}:`,
  'aliases:': `${ansis.blue('aliases')}:`,
};

/**
 * returns configurable yargs CLI for code-pushup
 *
 * @example
 * // bootstrap CLI; format arguments
 * yargsCli(hideBin(process.argv)).argv;
 */
export function yargsCli<T = unknown>(
  argv: string[],
  cfg: {
    usageMessage?: string;
    scriptName?: string;
    commands?: CommandModule[];
    options?: { [key: string]: Options };
    groups?: { [key: string]: string[] };
    examples?: [string, string][];
    middlewares?: {
      middlewareFunction: unknown;
      applyBeforeValidation?: boolean;
    }[];
    noExitProcess?: boolean;
  },
): Argv<T> {
  const { usageMessage, scriptName, noExitProcess } = cfg;
  const commands = cfg.commands ?? [];
  const middlewares = cfg.middlewares ?? [];
  const options = cfg.options ?? {};
  const groups = cfg.groups ?? {};
  const examples = cfg.examples ?? [];
  const cli = yargs(argv);

  const packageJson = createRequire(import.meta.url)(
    '../../package.json',
  ) as typeof import('../../package.json');

  // setup yargs
  cli
    .updateLocale(yargsDecorator)
    // take minimum of TERMINAL_WIDTH or full width of the terminal
    .wrap(Math.max(TERMINAL_WIDTH, cli.terminalWidth()))
    .help('help', descriptionStyle('Show help'))
    .alias('h', 'help')
    .showHelpOnFail(false)
    .version('version', ansis.dim('Show version'), packageJson.version)
    .check(args => {
      const persist = args['persist'] as PersistConfig | undefined;
      return persist == null || validatePersistFormat(persist);
    })
    .parserConfiguration({
      'strip-dashed': true,
    } satisfies Partial<ParserConfigurationOptions>)
    .coerce('config', (config: string | string[]) =>
      Array.isArray(config) ? config.at(-1) : config,
    )
    .options(formatNestedValues(options, 'describe'));

  // usage message
  if (usageMessage) {
    cli.usage(titleStyle(usageMessage));
  }

  // script name
  if (scriptName) {
    cli.scriptName(scriptName);
  }

  // add examples
  examples.forEach(([exampleName, description]) =>
    cli.example(exampleName, descriptionStyle(description)),
  );

  // add groups
  Object.entries(groups).forEach(([groupName, optionNames]) =>
    cli.group(optionNames, headerStyle(groupName)),
  );

  // add middlewares
  middlewares.forEach(({ middlewareFunction, applyBeforeValidation }) => {
    cli.middleware(
      logErrorBeforeThrow(middlewareFunction as MiddlewareFunction),
      applyBeforeValidation,
    );
  });

  // add commands
  commands.forEach(commandObj => {
    cli.command(
      formatObjectValue(
        {
          ...commandObj,
          handler: logErrorBeforeThrow(commandObj.handler),
          ...(typeof commandObj.builder === 'function' && {
            builder: logErrorBeforeThrow(commandObj.builder),
          }),
        },
        'describe',
      ),
    );
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

function validatePersistFormat(persist: PersistConfig) {
  try {
    if (persist.format != null) {
      persist.format
        .flatMap(format => format.split(','))
        .forEach(format => {
          validate(formatSchema, format);
        });
    }
    return true;
  } catch {
    throw new TypeError(
      `Invalid persist.format option. Valid options are: ${formatSchema.options.join(
        ', ',
      )}`,
    );
  }
}
