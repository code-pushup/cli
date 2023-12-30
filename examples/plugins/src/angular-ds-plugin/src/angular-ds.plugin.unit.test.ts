import { vol } from 'memfs';
import { unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import {
  generatedComponentStyles,
  inlineStylesComponentContent,
  invalidStyles,
  separateStylesComponentContent,
  validStyles,
} from '../mock/fixtures.mock';
import {
  PluginOptions,
  angularDsComponentStylesIssues,
  assertComponentStyles,
  errorMessageMissingVariableUsage,
  errorMessageNoUsageOfVariables,
  infoMessage,
  runnerFunction,
} from './angular-ds.plugin';

const outputDir = 'test';
const inlineStylesComponentFileName = 'inline-styles.component.ts';
const separateCssStylesComponentFileName = 'separate-css-styles.component.ts';
const separateCssStylesFileName = 'separate-css-styles.component.css';
//const separateScssStylesComponentFileName = 'separate-scss-styles.component.ts';
const separateScssStylesFileName = 'separate-scss-styles.component.scss';
const generatedStylesScssFileName = 'generated-styles.scss';

describe('infoMessage for correct styles', () => {
  it.each([
    ['any.component.ts', 'any-selector'],
    [join('src', 'any.component.ts'), 'any-other-selector'],
  ])('should return info message', (file, selector) => {
    expect(infoMessage(file, selector)).toBe(
      `${selector} in file ${basename(
        file,
      )} uses design system tokens in styles`,
    );
  });
});

describe('errorMessageNoUsageOfVariables for incorrect styles', () => {
  it.each([
    ['any.component.ts', 'any-selector'],
    [join('src', 'any.component.ts'), 'any-other-selector'],
  ])(
    'should return error message for size %i with budget %i',
    (path, selector) => {
      expect(errorMessageNoUsageOfVariables(path, selector)).toBe(
        `${selector} in file ${basename(
          path,
        )} does not use design system tokens in styles`,
      );
    },
  );
});

describe('errorMessageMissingVariableUsage for missing styles', () => {
  it('should return error message for size %i with budget %i', () => {
    const selector = 'my-selector';
    expect(
      errorMessageMissingVariableUsage('any.component.ts', 'my-selector', [
        '--blue',
      ]),
    ).toBe(
      `${selector} in file ${basename(
        'any.component.ts',
      )} has missing variables: ${['--blue'].join(', ')}`,
    );
  });
});

describe('assertComponentStyles', () => {
  it.each([['styles.component.scss', 'selector-1', validStyles()]])(
    'should return a informative issues for file %s with selector %s',
    async (filePath, selector, content) => {
      vol.fromJSON(
        {
          [generatedStylesScssFileName]: generatedComponentStyles,
        },
        MEMFS_VOLUME,
      );
      await expect(
        assertComponentStyles(filePath, selector, content, 'generated'),
      ).resolves.toEqual({
        message: infoMessage(filePath, selector),
        severity: 'info',
        source: { file: filePath },
      });
    },
  );

  it.each([['styles.component.scss', 'selector-1', validStyles()]])(
    'should return a informative Issue for file %s with selector %s and valid styles',
    async (filePath, selector, content) => {
      vol.fromJSON(
        {
          [generatedStylesScssFileName]: generatedComponentStyles,
        },
        MEMFS_VOLUME,
      );
      await expect(
        assertComponentStyles(filePath, selector, content, 'generated'),
      ).resolves.toEqual({
        message: infoMessage(filePath, selector),
        severity: 'info',
        source: { file: 'styles.component.scss' },
      });
    },
  );

  it.each([['styles.component.scss', 'selector-1', invalidStyles]])(
    'should return error Issue for file %s with selector %s and invalid styles',
    async () => {
      vol.fromJSON(
        {
          [generatedStylesScssFileName]: generatedComponentStyles,
        },
        MEMFS_VOLUME,
      );
      await expect(
        assertComponentStyles(
          'styles.component.scss',
          'selector',
          generatedComponentStyles,
          'generated',
        ),
      ).resolves.toEqual({
        message: errorMessageNoUsageOfVariables(
          'styles.component.scss',
          'selector',
        ),
        severity: 'error',
        source: { file: 'styles.component.scss' },
      });
    },
  );
});

describe('angularDsComponentStylesIssues', () => {
  const baseOptions: PluginOptions = {
    directory: '/',
    variableImportPattern: 'generated',
  };

  beforeEach(() => {
    vol.fromJSON(
      {
        [generatedStylesScssFileName]: generatedComponentStyles,
        [inlineStylesComponentFileName]: inlineStylesComponentContent(
          validStyles(),
        ),
        [separateCssStylesFileName]: validStyles('test'),
        [separateCssStylesComponentFileName]: separateStylesComponentContent(
          separateCssStylesFileName,
        ),
      },
      outputDir,
    );
  });

  it('should list all css and scss files', async () => {
    await expect(angularDsComponentStylesIssues(baseOptions)).resolves.toEqual(
      expect.arrayContaining(
        [separateCssStylesFileName, separateScssStylesFileName].map(f => ({
          message: expect.any(String),
          severity: expect.any(String),
          source: {
            file: expect.stringContaining(f),
          },
        })),
      ),
    );
  });

  it('should assert files that don`t include generated styles', async () => {
    await expect(
      angularDsComponentStylesIssues({
        ...baseOptions,
      }),
    ).resolves.toEqual(
      expect.arrayContaining([
        {
          message: expect.any(String),
          severity: 'error',
          source: {
            file: expect.stringContaining(separateScssStylesFileName),
          },
        },
      ]),
    );
  });

  it('should assert files that import general styles but have unused variables', async () => {
    await expect(
      angularDsComponentStylesIssues({
        ...baseOptions,
      }),
    ).resolves.toEqual([
      {
        message: expect.any(String),
        severity: 'error',
        source: {
          file: expect.stringContaining('styles.component.scss'),
        },
      },
    ]);
  });
});

describe('runnerFunction', () => {
  const baseOptions: PluginOptions = {
    directory: '/',
    variableImportPattern: 'generated',
  };
  const variableUsageAuditOutputBase = {
    displayValue: '0 files oversize',
    score: 1,
    slug: 'angular-ds-component-styles',
    value: 0,
  };

  it('should pass if no files that are given', async () => {
    // create empty directory
    vol.fromJSON(
      {
        'm.js': '',
      },
      MEMFS_VOLUME,
    );
    await unlink(join(MEMFS_VOLUME, 'm.js'));

    await expect(runnerFunction(baseOptions)).resolves.toEqual([
      variableUsageAuditOutputBase,
    ]);
  });

  it('should return issues if files are given and pass', async () => {
    vol.fromJSON(
      {
        [join('src', generatedStylesScssFileName)]: generatedComponentStyles,
        [separateCssStylesFileName]: validStyles('..'),
      },
      MEMFS_VOLUME,
    );
    await expect(runnerFunction(baseOptions)).resolves.toEqual([
      expect.objectContaining({
        ...variableUsageAuditOutputBase,
        details: {
          issues: expect.any(Array),
        },
      }),
    ]);
  });

  it('should have number of files given as value', async () => {
    await expect(runnerFunction(baseOptions)).resolves.toEqual([
      expect.objectContaining({
        displayValue: '0 files oversize',
        value: 0,
      }),
    ]);
  });

  it('should have files that are matching the pattern as issues', async () => {
    await expect(
      runnerFunction({
        ...baseOptions,
        variableImportPattern: 'generated',
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        details: {
          issues: [
            expect.objectContaining({
              source: {
                file: expect.stringContaining('styles.component.scss'),
              },
            }),
          ],
        },
      }),
    ]);
  });

  it('should have number of files that are over budget as value and listed in issues', async () => {
    await expect(
      runnerFunction({
        ...baseOptions,
        variableImportPattern: 'generated',
      }),
    ).resolves.toEqual([
      {
        ...variableUsageAuditOutputBase,
        displayValue: '1 file oversize',
        value: 1,
        score: expect.any(Number),
        details: {
          issues: expect.arrayContaining([
            {
              message:
                'File styles.component.scss has 154 B, this is 26 B too big. (budget: 128 B)',
              severity: 'error',
              source: {
                file: expect.stringContaining('styles.component.scss'),
              },
            },
          ]),
        },
      },
    ]);
  });

  it.each([
    [0, 2, 0],
    [128, 1, 0.5],
    [1000, 0, 1],
  ])('should have correct score', async (budget, value, score) => {
    await expect(
      runnerFunction({
        ...baseOptions,
        variableImportPattern: 'generated',
      }),
    ).resolves.toEqual([
      {
        ...variableUsageAuditOutputBase,
        displayValue: expect.stringContaining(value.toString()),
        value,
        score,
        details: {
          issues: expect.any(Array),
        },
      },
    ]);
  });
});
