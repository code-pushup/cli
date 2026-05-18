#! /usr/bin/env node
import { hideBin } from 'yargs/helpers';
import { axeSetupBinding } from '@code-pushup/axe-plugin';
import { coverageSetupBinding } from '@code-pushup/coverage-plugin';
import { eslintSetupBinding } from '@code-pushup/eslint-plugin';
import { jsPackagesSetupBinding } from '@code-pushup/js-packages-plugin';
import { jsDocsSetupBinding } from '@code-pushup/jsdocs-plugin';
import { lighthouseSetupBinding } from '@code-pushup/lighthouse-plugin';
import { typescriptSetupBinding } from '@code-pushup/typescript-plugin';
import { yargsCli } from './lib/setup/cli-args.js';
import type { PluginSetupBinding } from './lib/setup/types.js';
import { runSetupWizard } from './lib/setup/wizard.js';

const bindings: PluginSetupBinding[] = [
  eslintSetupBinding,
  coverageSetupBinding,
  jsPackagesSetupBinding,
  typescriptSetupBinding,
  lighthouseSetupBinding,
  axeSetupBinding,
  jsDocsSetupBinding,
];

const argv = await yargsCli(bindings).parse(hideBin(process.argv));

await runSetupWizard(bindings, argv);
