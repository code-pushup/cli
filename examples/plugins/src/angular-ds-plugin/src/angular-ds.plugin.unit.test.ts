import { vol } from 'memfs';
import { unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import {
  generatedComponentStyles,
  generatedStylesScssFileName,
  inlineStylesComponentContent,
  inlineStylesComponentFileName,
  invalidStyles,
  separateCssStylesComponentFileName,
  separateCssStylesFileName,
  separateScssStylesComponentFileName,
  separateScssStylesFileName,
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
    'should return error message for no usage of variables',
    (path, selector) => {
      expect(errorMessageNoUsageOfVariables(path, selector)).toBe(
        `${selector} in file ${path} does not use design system tokens in styles`,
      );
    },
  );
});

describe('errorMessageMissingVariableUsage for missing styles', () => {
  it('should return error message inc unused variables', () => {
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

  it('should list all css and scss files', async () => {
    vol.fromJSON(
      {
        [generatedStylesScssFileName]: generatedComponentStyles,
        [separateCssStylesComponentFileName]: separateStylesComponentContent(
          separateCssStylesFileName,
        ),
        [separateCssStylesFileName]: validStyles(),
        [inlineStylesComponentFileName]: inlineStylesComponentContent(
          validStyles(),
        ),
      },
      MEMFS_VOLUME,
    );
    await expect(angularDsComponentStylesIssues(baseOptions)).resolves.toEqual(
      expect.arrayContaining(
        [inlineStylesComponentFileName, separateCssStylesComponentFileName].map(
          f => ({
            message: expect.any(String),
            severity: expect.any(String),
            source: {
              file: expect.stringContaining(f),
            },
          }),
        ),
      ),
    );
  });

  it('should assert files that don`t include generated styles', async () => {
    vol.fromJSON(
      {
        [separateCssStylesComponentFileName]: separateStylesComponentContent(
          separateCssStylesFileName,
        ),
        [separateCssStylesFileName]: generatedComponentStyles,
        [inlineStylesComponentFileName]: inlineStylesComponentContent(
          generatedComponentStyles,
        ),
      },
      MEMFS_VOLUME,
    );
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
            file: expect.stringContaining(separateCssStylesComponentFileName),
          },
        },
      ]),
    );
  });

  it('should assert files that import general styles but have unused variables', async () => {
    vol.fromJSON(
      {
        [separateCssStylesComponentFileName]: separateStylesComponentContent(
          separateCssStylesFileName,
        ),
        [separateCssStylesFileName]: invalidStyles,
        [inlineStylesComponentFileName]:
          inlineStylesComponentContent(invalidStyles),
      },
      MEMFS_VOLUME,
    );
    await expect(
      angularDsComponentStylesIssues({
        ...baseOptions,
      }),
    ).resolves.toEqual([
      {
        message: expect.any(String),
        severity: 'error',
        source: {
          file: expect.stringContaining(inlineStylesComponentFileName),
        },
      },
      {
        message: expect.any(String),
        severity: 'error',
        source: {
          file: expect.stringContaining(separateCssStylesComponentFileName),
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
        [generatedStylesScssFileName]: generatedComponentStyles,
        [separateScssStylesComponentFileName]: separateStylesComponentContent(
          separateScssStylesFileName,
        ),
        [separateScssStylesFileName]: validStyles(),
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

  it('should have component files in the directory as issues', async () => {
    vol.fromJSON(
      {
        [generatedStylesScssFileName]: generatedComponentStyles,
        [separateScssStylesComponentFileName]: separateStylesComponentContent(
          separateScssStylesFileName,
        ),
        [separateScssStylesFileName]: validStyles(),
      },
      MEMFS_VOLUME,
    );
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
                file: expect.stringContaining(
                  separateScssStylesComponentFileName,
                ),
              },
            }),
          ],
        },
      }),
    ]);
  });

  it('should have number of component files that as value and listed in issues', async () => {
    vol.fromJSON(
      {
        [generatedStylesScssFileName]: generatedComponentStyles,
        [separateScssStylesComponentFileName]: separateStylesComponentContent(
          separateScssStylesFileName,
        ),
        [separateScssStylesFileName]: invalidStyles,
      },
      MEMFS_VOLUME,
    );
    await expect(
      runnerFunction({
        ...baseOptions,
        variableImportPattern: 'generated',
      }),
    ).resolves.toEqual([
      {
        ...variableUsageAuditOutputBase,
        displayValue: '1 component',
        value: 1,
        score: expect.any(Number),
        details: {
          issues: expect.arrayContaining([
            {
              message:
                'ui-backdrop in file /test/separate-scss-styles.component.ts does not use design system tokens in styles',
              severity: 'error',
              source: {
                file: expect.stringContaining(
                  separateScssStylesComponentFileName,
                ),
              },
            },
          ]),
        },
      },
    ]);
  });

  it.each([
    [
      {
        [separateScssStylesComponentFileName]: separateStylesComponentContent(
          separateScssStylesFileName,
        ),
        [separateScssStylesFileName]: invalidStyles,
      },
      1,
      0,
    ],
    [
      {
        [inlineStylesComponentFileName]:
          inlineStylesComponentContent(invalidStyles),
      },
      1,
      0,
    ],
    [
      {
        [generatedStylesScssFileName]: generatedComponentStyles,
        [separateScssStylesFileName]: validStyles(),
        [separateScssStylesComponentFileName]: separateStylesComponentContent(
          separateScssStylesFileName,
        ),
      },
      1,
      1,
    ],
    [
      {
        [generatedStylesScssFileName]: generatedComponentStyles,
        [inlineStylesComponentFileName]: inlineStylesComponentContent(
          validStyles(),
        ),
      },
      1,
      1,
    ],
  ])('should have correct score for %s', async (fsContent, value, score) => {
    vol.fromJSON(fsContent, MEMFS_VOLUME);
    await expect(
      runnerFunction({
        ...baseOptions,
        variableImportPattern: 'generated',
      }),
    ).resolves.toEqual([
      {
        ...variableUsageAuditOutputBase,
        displayValue: expect.stringContaining(value + ''),
        value,
        score,
        details: {
          issues: expect.any(Array),
        },
      },
    ]);
  });
});
