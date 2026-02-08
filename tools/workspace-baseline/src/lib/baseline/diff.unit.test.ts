import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import ansis from 'ansis';
import { renderTreeDiff } from './diff.js';

describe('renderTreeDiff', () => {
  const tree = createTreeWithEmptyWorkspace();
  beforeEach(() => {
    tree.write(
      'tsconfig.json',
      JSON.stringify({ compilerOptions: { strict: true } }, null, 2),
    );
  });
  it('should return diff string when content changes', () => {
    const nextContent = JSON.stringify(
      { compilerOptions: { strict: true, esModuleInterop: true } },
      null,
      2,
    );

    const diff = renderTreeDiff(tree, 'tsconfig.json', nextContent);

    const expected = [
      ansis.gray(' Index: tsconfig.json'),
      ansis.gray(
        ' ===================================================================',
      ),
      ansis.gray('@@ -1,5 +1,6 @@'),
      ansis.gray('  {'),
      ansis.gray('    "compilerOptions": {'),
      ansis.bgRed.black(' -    "strict": true'),
      ansis.bgGreen.black(' +    "strict": true,'),
      ansis.bgGreen.black(' +    "esModuleInterop": true'),
      ansis.gray('    }'),
      ansis.gray('  }'),
      ansis.gray(' \\ No newline at end of file'),
      ansis.gray(' '),
    ].join('\n');

    expect(diff).toBe(expected);
  });
});
