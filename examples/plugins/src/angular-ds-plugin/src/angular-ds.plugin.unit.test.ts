import { vol } from 'memfs';
import { unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  PluginOptions,
  angularDsComponentStylesIssues,
  assertComponentStyles,
  errorMessage,
  infoMessage,
  runnerFunction,
} from './angular-ds.plugin';

const outputDir = 'test';
const inlineStylesComponentFileName = 'inline-styles.component.ts';
const separateCssStylesComponentFileName = 'separate-css-styles.component.ts';
const separateCssStylesFileName = 'separate-css-styles.component.css';
const separateScssStylesComponentFileName = 'separate-scss-styles.component.ts';
const separateScssStylesFileName = 'separate-scss-styles.component.scss';
const generatedStylesScssFileName = 'generated-styles.scss';

const validStyles = `
@import '/generated/styles/components/generated-styles.scss';

.my-class {
  background: red;
}
`;

const invalidStyles = `
.my-class {
  background: red;
}
`;
const generatedComponentStyles = `
.my-class {
  background: red;
}
`;

const inlineStylesComponent = (stylesContent: string) => `
@Component({
selector: 'inline-styles-comp',
styles: [\`${stylesContent}\`]
})
export class InlineStylesComponent {

}
`;
const separateStylesComponent = (stylesPath: string) => `
@Component({
selector: 'separate-styles-comp',
styleFile: '${stylesPath}'
})
export class SeparateCssStylesComponent {}
`;

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

describe('errorMessage for incorrect styles', () => {
  it.each([
    ['any.component.ts', 'any-selector'],
    [join('src', 'any.component.ts'), 'any-other-selector'],
  ])('should return error message for size %i with budget %i', selector => {
    expect(errorMessage('any.component.ts', selector)).toBe(
      `⚠️ ${selector} in file ${basename(
        'any.component.ts',
      )} does not use design system tokens in styles`,
    );
  });
});

describe('assertComponentStyles', () => {
  it.each([['styles.component.scss', 'selector-1', validStyles]])(
    'should return a informative issues for file %s with selector %s',
    (filePath, selector, content) => {
      expect(assertComponentStyles(filePath, selector, content)).toEqual({
        message: infoMessage(filePath, selector),
        severity: 'info',
        source: { file: filePath },
      });
    },
  );

  it.each([['styles.component.scss', 'selector-1', validStyles]])(
    'should return a informative Issue for file %s with selector %s and valid styles',
    (filePath, selector, content) => {
      expect(assertComponentStyles(filePath, selector, content)).toEqual({
        message: infoMessage(filePath, selector),
        severity: 'info',
        source: { file: 'styles.component.scss' },
      });
    },
  );

  it.each([['styles.component.scss', 'selector-1', invalidStyles]])(
    'should return error Issue for file %s with selector %s and invalid styles',
    () => {
      expect(
        assertComponentStyles(
          'styles.component.scss',
          'selector',
          '.class { color: red; }',
        ),
      ).toEqual({
        message: errorMessage('styles.component.scss', 'selector'),
        severity: 'error',
        source: { file: 'styles.component.scss' },
      });
    },
  );
});

describe('angularDsComponentStylesIssues', () => {
  const baseOptions: PluginOptions = {
    directory: '/',
  };

  beforeEach(() => {
    vol.fromJSON(
      {
        [inlineStylesComponentFileName]: inlineStylesComponent(validStyles),
        [separateCssStylesComponentFileName]: separateStylesComponent(
          separateCssStylesFileName,
        ),
        [separateScssStylesComponentFileName]: separateStylesComponent(
          separateScssStylesFileName,
        ),
        [separateCssStylesFileName]: validStyles,
        [separateScssStylesFileName]: invalidStyles,
        [generatedStylesScssFileName]: generatedComponentStyles,
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

  /*
    it('should list ts files containing @Component', async () => {
      await expect(
        angularDsComponentStylesIssues({
          ...baseOptions,
        }),
      ).resolves.toEqual([
        {
          message: expect.any(String),
          severity: expect.any(String),
          source: {
            file: expect.stringContaining('styles.component.scss'),
          },
        },
      ]);
    });
  */

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
  };
  const filesizeAuditOutputBase = {
    displayValue: '0 files oversize',
    score: 1,
    slug: 'file-size-unmodified',
    value: 0,
  };

  beforeEach(() => {
    vol.fromJSON(
      {
        [inlineStylesComponentFileName]: inlineStylesComponent(validStyles),
        [separateCssStylesComponentFileName]: separateStylesComponent(
          separateCssStylesFileName,
        ),
        [separateScssStylesComponentFileName]: separateStylesComponent(
          separateScssStylesFileName,
        ),
      },
      outputDir,
    );
  });

  it('should return pass if no files are given and pass', async () => {
    vol.reset();
    // create empty directory
    vol.fromJSON(
      {
        'm.js': '',
      },
      outputDir,
    );
    await unlink(join(outputDir, 'm.js'));

    await expect(runnerFunction(baseOptions)).resolves.toEqual([
      filesizeAuditOutputBase,
    ]);
  });

  it('should return issues if files are given and pass', async () => {
    await expect(runnerFunction(baseOptions)).resolves.toEqual([
      expect.objectContaining({
        ...filesizeAuditOutputBase,
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

  it('should have files in issues that are matching the pattern as issues', async () => {
    await expect(
      runnerFunction({
        ...baseOptions,
        pattern: /\.js$/,
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
        budget: 128,
      }),
    ).resolves.toEqual([
      {
        ...filesizeAuditOutputBase,
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
        budget,
      }),
    ).resolves.toEqual([
      {
        ...filesizeAuditOutputBase,
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
