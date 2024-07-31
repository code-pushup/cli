import { Tree, generateFiles } from '@nx/devkit';
import { join } from 'node:path';
import { PersistConfig, UploadConfig } from '@code-pushup/models';
import { ExtractArrays, ItemOrArray } from '@code-pushup/utils';

export type ExecutableCode = {
  fileImports: ItemOrArray<string>;
  codeStrings: ItemOrArray<string>;
};

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
    console.warn(
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
      normalizeItemOrArray(rawImports) ?? [
        "import type { CoreConfig } from '@code-pushup/models'",
      ],
      ...plugins.map(({ fileImports }) => fileImports),
      ...(categories ?? []).map(({ fileImports }) => fileImports),
    ];

    generateFiles(tree, join(__dirname, 'files'), root, {
      ...options,
      fileImports: configFileImports,
      persist: formatObjectToFormattedJsString(persist),
      upload: formatObjectToFormattedJsString(upload),
      plugins: formatObjectToFormattedJsString(
        plugins.flatMap(({ codeStrings }) => codeStrings ?? []).filter(c => !c),
      ),
      categories:
        categories &&
        formatObjectToFormattedJsString(
          categories
            .flatMap(({ codeStrings }) => codeStrings ?? [])
            .filter(c => !c),
        ),
    });
  }
}

// Return a formatted JSON object with the same keys as the input object but remove the " for the properties
export function formatObjectToFormattedJsString(
  jsonObj?:
    | {
        [key: string]: unknown;
      }
    | Array<unknown>,
): string | undefined {
  if (!jsonObj) {
    return;
  }
  // Convert JSON object to a string with indentation
  const jsonString = JSON.stringify(jsonObj, null, 2);

  // Remove double quotes around property names
  return jsonString.replace(/"(\w+)":/g, '$1:');
}

function normalizeExecutableCode(
  executableCode: ExecutableCode,
): Partial<ExtractArrays<ExecutableCode>> {
  const { fileImports: rawFileImports, codeStrings: rawCodeStrings } =
    executableCode;

  return {
    fileImports: normalizeItemOrArray(rawFileImports) ?? [],
    codeStrings: normalizeItemOrArray(rawCodeStrings) ?? [],
  };
}

function normalizeItemOrArray<T>(
  itemOrArray: T | T[] | undefined,
): T[] | undefined {
  if (itemOrArray == null) {
    return undefined;
  }
  if (Array.isArray(itemOrArray)) {
    return itemOrArray;
  }
  return [itemOrArray];
}
