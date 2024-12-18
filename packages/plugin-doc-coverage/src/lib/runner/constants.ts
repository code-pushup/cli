import path from 'node:path';
import { pluginWorkDir } from '@code-pushup/utils';

export const WORKDIR = pluginWorkDir('doc-coverage');

export const RUNNER_OUTPUT_PATH = path.join(WORKDIR, 'runner-output.json');

export const PLUGIN_CONFIG_PATH = path.join(
  process.cwd(),
  WORKDIR,
  'plugin-config.json',
);

export const enum ProgrammingLanguage {
  JavaScript = 'javascript',
  TypeScript = 'typescript',
}

export const DEFAULT_SOURCE_GLOB = {
  [ProgrammingLanguage.JavaScript]: '"src/**/*.js"',
  [ProgrammingLanguage.TypeScript]: '"src/**/*.ts"',
};

export const DEFAULT_OUTPUT_FOLDER_PATH = './documentation';

export const COMMANDS_FOR_LANGUAGES: Readonly<
  Record<ProgrammingLanguage, { command: string; args: string }>
> = {
  [ProgrammingLanguage.JavaScript]: {
    command: 'npx',
    args: 'typedoc $sourceGlob --entryPointStrategy expand --plugin typedoc-plugin-coverage --coverageOutputType json --skipErrorChecking --out $outputFolderPath',
  },
  [ProgrammingLanguage.TypeScript]: {
    command: 'npx',
    args: 'typedoc $sourceGlob --entryPointStrategy expand --plugin typedoc-plugin-coverage --coverageOutputType json --skipErrorChecking --out $outputFolderPath',
  },
} as const;

export type TypedocResult = {
  percent: number;
  notDocumented: string[];
};
