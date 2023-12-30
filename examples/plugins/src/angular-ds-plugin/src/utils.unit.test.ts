import { vol } from 'memfs';
import { beforeEach, describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import { generatedStylesRegex, loadGeneratedStyles } from './utils';

const validStyles = `
@import '${MEMFS_VOLUME}/generated-styles.scss';

.my-class {
  background: red;
}
`;

describe('generatedStylesRegex', () => {
  // test valid and array of strings against slugRegex with it blocks
  it.each([
    `
    @import 'foundation/code', 'foundation/lists';
    @import "generated/styles/components/generated-styles.scss";
    `,
    `
    @import 'generated/styles/components/generated-styles.scss';
    .badge {
      color: red;
    }
    `,
    validStyles,
  ])(`should match valid content %p`, stylesContent => {
    expect(stylesContent).toMatch(
      generatedStylesRegex('generated/styles/components'),
    );
  });

  // test invalid and array of strings against slugRegex with it blocks
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

describe('loadGeneratedStyles', () => {
  const generatedComponentStyles = `
.my-class {
  background: red;
}
`;
  const generatedStylesScssFileName = 'generated-styles.scss';

  it('should load generated styles', async () => {
    beforeEach(() => {
      vol.fromJSON(
        {
          ['styles.scss']: validStyles,
          [generatedStylesScssFileName]: generatedComponentStyles,
        },
        MEMFS_VOLUME,
      );
    });
    await expect(
      loadGeneratedStyles(validStyles, generatedStylesScssFileName),
    ).resolves.toBe(generatedComponentStyles);
  });
});
