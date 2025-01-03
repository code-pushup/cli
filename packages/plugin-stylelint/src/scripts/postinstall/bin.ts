import { patchStylelint } from './index.js';

(async () => {
  await patchStylelint();
  console.log('stylelint patched!');
})();
