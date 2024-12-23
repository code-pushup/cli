import { generateAuditsFromGithub } from './utils.js';

// node --experimental-strip-types packages/plugin-typescript/tools/generate-audits/bin.ts
console.log('GENERATE AUDITS');
(async () => await generateAuditsFromGithub())();
