import {updateKnownConfigMap,} from './generate-ts-config.js';

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
  await updateKnownConfigMap();
})();
