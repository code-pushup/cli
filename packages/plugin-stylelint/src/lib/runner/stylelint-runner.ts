import stylelint, { type LinterOptions } from 'stylelint';
import type { Audit } from '@code-pushup/models';

// Run Stylelint Programmatically
export async function lintStyles(opt: LinterOptions) {
  try {
    const { results } = await stylelint.lint({
      ...opt,
      formatter: 'json',
    });
    return results;
  } catch (error) {
    throw new Error('Error while linting: ' + error);
  }
}
