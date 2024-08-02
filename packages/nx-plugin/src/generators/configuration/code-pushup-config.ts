import { Tree, generateFiles, logger } from '@nx/devkit';
import { join } from 'node:path';
import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import type { ItemOrArray } from '@code-pushup/utils';
import { ExecutableCode } from './types';
import {
  formatArrayToJSArray,
  formatArrayToLinesOfJsString,
  formatObjectToFormattedJsString,
  normalizeExecutableCode,
  normalizeItemOrArray,
} from './utils';

export const DEFAULT_IMPORTS = [
  "import type { CoreConfig } from '@code-pushup/models;'",
];

export type GenerateCodePushupConfigOptions = {
  fileImports?: ItemOrArray<string>;
  persist?: Partial<PersistConfig>;
  upload?: Partial<UploadConfig>;
  plugins?: ExecutableCode[];
  categories?: ExecutableCode[];
};

export function generateCodePushupConfig(
  tree: Tree,
  root: string,
  options?: GenerateCodePushupConfigOptions,
) {
  const supportedFormats = ['ts', 'mjs', 'js'];
  const firstExistingFormat = supportedFormats.find(ext =>
    tree.exists(join(root, `code-pushup.config.${ext}`)),
  );
  if (firstExistingFormat) {
    logger.warn(
      `NOTE: No config file created as code-pushup.config.${firstExistingFormat} file already exists.`,
    );
  } else {
    const {
      fileImports: rawImports,
      persist,
      upload,
      plugins: rawPlugins = [], // plugins are required
      categories: rawCategories,
    } = options ?? {};

    const plugins = rawPlugins.map(normalizeExecutableCode);
    const categories = rawCategories?.map(normalizeExecutableCode);
    const configFileImports = [
      ...(rawImports ? normalizeItemOrArray(rawImports) : DEFAULT_IMPORTS),
      ...plugins.flatMap(({ fileImports }) => fileImports),
      ...(categories ?? []).flatMap(({ fileImports }) => fileImports),
    ];

    generateFiles(tree, join(__dirname, 'files'), root, {
      ...options,
      fileImports: formatArrayToLinesOfJsString(configFileImports),
      persist: formatObjectToFormattedJsString(persist),
      upload: formatObjectToFormattedJsString(upload),
      plugins: formatArrayToJSArray(
        plugins.flatMap(({ codeStrings }) => codeStrings),
      ),
      categories:
        categories &&
        formatArrayToJSArray(
          categories.flatMap(({ codeStrings }) => codeStrings),
        ),
    });
  }
}
