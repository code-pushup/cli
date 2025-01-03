import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const absolutesStylelintPath = resolve(
  process.cwd(),
  'node_modules/stylelint/lib/index.mjs'
);

export async function patchStylelint(stylelintPath = absolutesStylelintPath) {
  try {
    let content = await readFile(stylelintPath, 'utf-8');

    if (!content.includes('default as getConfigForFile')) {
      content += `
        export { default as getConfigForFile } from './getConfigForFile.mjs';
      `;
      await writeFile(stylelintPath, content, 'utf-8');
      console.log('Patched Stylelint successfully.');
    } else {
      console.log('Stylelint already patched.');
    }
  } catch (error) {
    console.error('Error patching Stylelint:', error.message);
  }
}
