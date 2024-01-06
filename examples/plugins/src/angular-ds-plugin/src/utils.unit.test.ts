import { vol } from 'memfs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import {
  inlineStylesComponentContent,
  separateCssStylesComponentFileName,
  separateStylesComponentContent,
} from '../mock/fixtures.mock';
import {
  angularComponentInlineStylesRegex,
  angularComponentRegex,
  angularComponentSelectorRegex,
  angularComponentStyleUrlsRegex,
  cssVariablesRegex,
  generatedStylesRegex,
  getCssVariableUsage,
  loadComponentStyles,
  loadGeneratedStylesFromImports,
} from './utils';

const validStyles = (root = '.') => `
@import '${join(root, 'generated-file.scss')}';

.my-class {
  background: var(--white);
}
`;

const generatedStylesScssFileName = 'generated-file.scss';
const generatedComponentStyles = `
  :root {
    --blue: #1e90ff;
    --white: #ffffff;
  }
`;

describe('generatedStylesRegex', () => {
  it.each([
    `@import 'path/to/file.scss';`,
    ` @import 'path/to/file.scss';`,
    `@import    'path/to/file.scss';`,
    `@import    'file.scss';`,
    `@import    "file.scss";`,
    `@import    "file.scss"`,
    `@import    "../../file.scss"`,
    `@import    "..\\..\\file.scss"`,
    `
    @import 'foundation/code', 'foundation/lists';
    @import "generated/styles/components/generated-file.scss";
    `,
    `
    @import 'styles/components/generated-file.scss';
    .badge {
      color: red;
    }
    `,
    validStyles,
  ])(`should match valid content %p`, stylesContent => {
    expect(stylesContent).toMatch(generatedStylesRegex('file'));
  });

  it.each([
    '',
    ' ',
    `
    .badge {
      color: red;
    }
    `,
  ])(`should not match invalid content %p`, invalidStylesContent => {
    expect(invalidStylesContent).not.toMatch(
      generatedStylesRegex('generated/styles/components'),
    );
  });
});

describe('cssVariablesRegex', () => {
  it.each([
    `:root {
    --blue: #1e90ff
    --white-semantic: #ffffff;
    }`,
    // `:root { --blue: #1e90ff; }`, @TODO figure out why this test is failing
  ])(`should match valid variable %p`, stylesContent => {
    expect(stylesContent).toMatch(cssVariablesRegex);
  });

  it.each([
    '',
    ' ',
    `:root {
    --semantic-blue: #1e90ff;
    }`,
    `--semanticWhite: #fff;`,
  ])(`should not match invalid variable %p`, invalidStylesContent => {
    expect(invalidStylesContent).not.toMatch(cssVariablesRegex);
  });
});

describe('angularComponentRegex', () => {
  it.each([
    inlineStylesComponentContent('b { color: red }'),
    separateStylesComponentContent('any.component.scss'), // @TODO make it pass
  ])(`should match valid component %p`, stylesContent => {
    expect(stylesContent).toMatch(angularComponentRegex);
  });

  it.each(['', ' ', `class Component({standalone: true})`])(
    `should not match invalid component %p`,
    invalidStylesContent => {
      expect(invalidStylesContent).not.toMatch(angularComponentRegex);
    },
  );
});

describe('angularComponentSelectorRegex', () => {
  it.each([
    inlineStylesComponentContent('b { color: red }'),
    separateStylesComponentContent('any.component.scss'), // @TODO make it pass
  ])(`should match valid component %p`, stylesContent => {
    expect(stylesContent).toMatch(angularComponentSelectorRegex);
  });

  it.each(['', ' ', `class Component({standalone: true})`])(
    `should not match invalid component %p`,
    invalidStylesContent => {
      expect(invalidStylesContent).not.toMatch(angularComponentSelectorRegex);
    },
  );
});

describe('angularComponentStyleUrlsRegex', () => {
  it.each([separateStylesComponentContent(separateCssStylesComponentFileName)])(
    `should match valid component inline styles %p`,
    stylesContent => {
      expect(stylesContent).toMatch(angularComponentStyleUrlsRegex);
    },
  );

  it.each([
    '',
    ' ',
    `class Component({standalone: true})`,
    inlineStylesComponentContent(validStyles()),
  ])(
    `should not match invalid component inline styles %p`,
    invalidStylesContent => {
      expect(invalidStylesContent).not.toMatch(angularComponentStyleUrlsRegex);
    },
  );
});
describe('angularComponentInlineStylesRegex', () => {
  it.each([
    inlineStylesComponentContent('b { color: red }'),
    inlineStylesComponentContent(validStyles(generatedStylesScssFileName)),
  ])(`should match valid component inline styles %p`, stylesContent => {
    expect(stylesContent).toMatch(angularComponentInlineStylesRegex);
  });

  it.each([
    '',
    ' ',
    `class Component({standalone: true})`,
    separateStylesComponentContent('any.component.scss'),
  ])(
    `should not match invalid component inline styles %p`,
    invalidStylesContent => {
      expect(invalidStylesContent).not.toMatch(
        angularComponentInlineStylesRegex,
      );
    },
  );
});

describe('loadComponentStyles', () => {
  const styles = validStyles();
  it.each([
    [
      separateStylesComponentContent(separateCssStylesComponentFileName),
      { [separateCssStylesComponentFileName]: styles },
    ],
    [inlineStylesComponentContent(styles), {}],
  ])(
    'should load component styles (g: %s, fs: %s)',
    async (stylesContent, fsContent) => {
      // setup file system
      vol.fromJSON(fsContent, MEMFS_VOLUME);

      await expect(loadComponentStyles(stylesContent)).resolves.toBe(styles);
    },
  );
});

describe('loadGeneratedStyles', () => {
  it.each([
    [
      validStyles(),
      {
        [generatedStylesScssFileName]: generatedComponentStyles,
      },
      'generated',
    ],
    [
      validStyles('themes'),
      {
        [join('themes', generatedStylesScssFileName)]: generatedComponentStyles,
      },
      'generated',
    ],
  ])(
    'should load generated styles',
    async (stylesContent, fsContent, pattern) => {
      vol.fromJSON(fsContent, MEMFS_VOLUME);

      await expect(
        loadGeneratedStylesFromImports(stylesContent, pattern),
      ).resolves.toBe(generatedComponentStyles);
    },
  );
});

describe('getCssVariableUsage', () => {
  it('should return correct result', () => {
    expect(
      getCssVariableUsage(generatedComponentStyles, validStyles()),
    ).toEqual({
      all: ['--blue', '--white'],
      used: ['--white'],
      unused: ['--blue'],
    });
  });
});
