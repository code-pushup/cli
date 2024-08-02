import * as devKit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { osAgnosticPath } from '@code-pushup/test-utils';
import {
  DEFAULT_IMPORTS,
  generateCodePushupConfig,
} from './code-pushup-config';
import {
  formatArrayToJSArray,
  formatArrayToLinesOfJsString,
  formatObjectToFormattedJsString,
  normalizeExecutableCode,
} from './utils';

describe('generateCodePushupConfig options', () => {
  let tree: devKit.Tree;
  const testProjectName = 'test-app';
  const generateFilesSpy = vi.spyOn(devKit, 'generateFiles');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    devKit.addProjectConfiguration(tree, testProjectName, {
      root: 'test-app',
    });
  });

  afterEach(() => {
    generateFilesSpy.mockReset();
  });

  it('should create code-pushup.config.ts with options', () => {
    generateFilesSpy.mockImplementation((...[_, __, target, options]) => {
      expect({ target, options }).toMatchSnapshot();
    });

    generateCodePushupConfig(tree, testProjectName, {
      fileImports: ["import type { CoreConfig } from 'dist/packages/models';"],
      persist: { filename: 'report-123' },
      upload: { apiKey: '123' },
      plugins: [
        {
          fileImports: "import * as myPlugin from 'my-plugin';",
          codeStrings: 'myPlugin({ timeout: 42})',
        },
      ],
      categories: [
        {
          fileImports: "import {myPluginCategory} from 'my-plugin';",
          codeStrings: 'myPluginCategory()',
        },
      ],
    });

    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        fileImports: formatArrayToLinesOfJsString([
          "import type { CoreConfig } from 'dist/packages/models';",
          "import * as myPlugin from 'my-plugin';",
          "import {myPluginCategory} from 'my-plugin';",
        ]),
        persist: formatObjectToFormattedJsString({ filename: 'report-123' }),
        upload: formatObjectToFormattedJsString({ apiKey: '123' }),
        plugins: formatArrayToJSArray(['myPlugin({ timeout: 42})']),
        categories: formatArrayToJSArray(['myPluginCategory()']),
      }),
    );
  });

  it('should call generateFilesSpy', () => {
    generateCodePushupConfig(tree, testProjectName);
    expect(generateFilesSpy).toHaveBeenCalledTimes(1);
  });

  it('should use correct templates', () => {
    generateCodePushupConfig(tree, testProjectName);
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(
        osAgnosticPath('nx-plugin/src/generators/configuration/files') ?? '',
      ),
      expect.any(String),
      expect.any(Object),
    );
  });

  it('should use correct testProjectName', () => {
    generateCodePushupConfig(tree, testProjectName);
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      testProjectName,
      expect.any(Object),
    );
  });

  it('should use default options', () => {
    generateCodePushupConfig(tree, testProjectName);
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      {
        categories: undefined,
        fileImports: formatArrayToLinesOfJsString(DEFAULT_IMPORTS),
        persist: undefined,
        plugins: formatArrayToJSArray([]),
        upload: undefined,
      },
    );
  });

  it('should use fileImports options', () => {
    generateCodePushupConfig(tree, testProjectName, {
      fileImports: [
        "import type { CoreConfig } from '../../dist/packages/models';",
      ],
    });
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        fileImports: formatArrayToLinesOfJsString([
          "import type { CoreConfig } from '../../dist/packages/models';",
        ]),
      }),
    );
  });

  it('should use persist options', () => {
    generateCodePushupConfig(tree, testProjectName, {
      persist: {
        filename: 'test-report',
        outputDir: 'tmp/results',
        format: ['md'],
      },
    });
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        persist: formatObjectToFormattedJsString({
          filename: 'test-report',
          outputDir: 'tmp/results',
          format: ['md'],
        }),
      }),
    );
  });

  it('should use upload options', () => {
    generateCodePushupConfig(tree, testProjectName, {
      upload: {
        organization: 'code-pushup',
        project: 'cli',
        server: 'https://code-pushup.dev/portal',
        apiKey: '12345678',
      },
    });
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        upload: formatObjectToFormattedJsString({
          organization: 'code-pushup',
          project: 'cli',
          server: 'https://code-pushup.dev/portal',
          apiKey: '12345678',
        }),
      }),
    );
  });

  it('should use plugins options', () => {
    generateCodePushupConfig(tree, testProjectName, {
      plugins: [
        {
          fileImports: 'import * as myPlugin from "my-import";',
          codeStrings: 'myPlugin({ timeout: 42})',
        },
      ],
    });
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        fileImports: formatArrayToLinesOfJsString([
          ...DEFAULT_IMPORTS,
          'import * as myPlugin from "my-import";',
        ]),
        plugins: formatArrayToJSArray(['myPlugin({ timeout: 42})']),
      }),
    );
  });

  it('should use categories options', () => {
    generateCodePushupConfig(tree, testProjectName, {
      categories: [
        {
          fileImports: 'import {defaultCategory} from "my-plugin";',
          codeStrings: 'defaultCategory()',
        },
      ],
    });
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        fileImports: formatArrayToLinesOfJsString([
          ...DEFAULT_IMPORTS,
          'import {defaultCategory} from "my-plugin";',
        ]),
        categories: formatArrayToJSArray(['defaultCategory()']),
      }),
    );
  });
});

describe('normalizeExecutableCode', () => {
  it('should normalize fileImports as string', () => {
    expect(
      normalizeExecutableCode({
        fileImports: 'import * as test from "test"',
        codeStrings: 'plugin()',
      }),
    ).toStrictEqual(
      expect.objectContaining({
        fileImports: ['import * as test from "test"'],
      }),
    );
  });

  it('should normalize fileImports as array', () => {
    expect(
      normalizeExecutableCode({
        fileImports: ['import * as test from "test"'],
        codeStrings: 'plugin()',
      }),
    ).toStrictEqual(
      expect.objectContaining({
        fileImports: ['import * as test from "test"'],
      }),
    );
  });

  it('should normalize codeStrings as string', () => {
    expect(
      normalizeExecutableCode({
        fileImports: 'import * as test from "test"',
        codeStrings: 'plugin()',
      }),
    ).toStrictEqual(
      expect.objectContaining({
        codeStrings: ['plugin()'],
      }),
    );
  });

  it('should normalize codeStrings as array', () => {
    expect(
      normalizeExecutableCode({
        fileImports: 'import * as test from "test"',
        codeStrings: ['plugin()'],
      }),
    ).toStrictEqual(
      expect.objectContaining({
        codeStrings: ['plugin()'],
      }),
    );
  });
});
