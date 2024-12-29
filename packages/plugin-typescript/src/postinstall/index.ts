import { generateCurrentTsConfig } from './utils.js';

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
  await generateCurrentTsConfig();
  console.log('Generated current TS config');
})();
