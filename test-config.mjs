import {
  configureCoveragePlugin,
  configureEslintPlugin,
  configureJsDocsPlugin,
} from './code-pushup.preset.js';

async function test() {
  try {
    console.log('Testing eslint plugin...');
    const eslint = await configureEslintPlugin('models');
    console.log('✓ ESLint plugin loaded');

    console.log('Testing coverage plugin...');
    const coverage = await configureCoveragePlugin('models');
    console.log('✓ Coverage plugin loaded');

    console.log('Testing jsdocs plugin...');
    const jsdocs = await configureJsDocsPlugin('models');
    console.log('✓ JSDocs plugin loaded');

    console.log('All plugins loaded successfully!');
  } catch (error) {
    console.error('Error loading plugins:', error);
  }
}

test();
