// go to each component inside the design system
// read the styles file
// inside the styles file check if the component is importing from generated/styles
// if no skip
// if yes read the generated/styles file and create a set of all css variables
// then read the component css file and create a set of all used css variables
// compare the variables and print how much are used/not used
import fs from 'fs/promises';
import * as path from 'path';

const UI_COMPONENTS_PATH = 'C:\\Projects\\vanilla\\packages\\design-system\\ui';

const COMPONENTS = {
  'ds-badge': 'badge/src/badge.component.scss',
  'ds-bottom-nav-tab': 'bottom-nav-tab/src/bottom-nav-tab.component.scss',
};

async function check() {
  const componentsWithStylesheets = Object.keys(COMPONENTS).reduce(
    (acc, curr: string) => {
      return [...acc, { selector: curr, scssPath: COMPONENTS[curr] }];
    },
    [] as Array<{ selector: string; scssPath: string }>,
  );

  for (const item of componentsWithStylesheets) {
    console.log(`\n\n----------------------- \n\n`);
    const fullPath = path.join(UI_COMPONENTS_PATH, item.scssPath);
    const scssContent = (await fs.readFile(fullPath, { encoding: 'utf8' })) || '';

    if (!scssContent.includes('/generated/styles/components')) {
      console.log('\x1b[33m%s\x1b[0m', `\n\n⚠️ ${item.selector} is not using generated tokens!\n\n`);
      continue;
    }

    console.log('\x1b[33m%s\x1b[0m', `\n${item.selector}\n`);

    const regex = /@import\s+['"]([^'"]+)['"]/g;

    const scssImportPath = scssContent.match(regex)?.[0].replace(`@import '../../`, '').slice(0, -1); // remove last '

    const generatedStylePath = path.join(UI_COMPONENTS_PATH, scssImportPath + '.scss');

    const generatedStyleContent = await fs.readFile(generatedStylePath, { encoding: 'utf8' });

    const generatedStylesVariables = getAllCssVariables(generatedStyleContent);
    const componentStyleCssVariables = getAllCssVariables(scssContent);

    const notUsedVars = [];
    for (const generatedVar of generatedStylesVariables) {
      if (!componentStyleCssVariables.includes(generatedVar)) {
        notUsedVars.push(generatedVar);
      }
    }

    const notUsedPercentage = Math.floor((notUsedVars.length / generatedStylesVariables.length) * 100);

    console.log(`Not used css variables - ${notUsedPercentage}% :
             ${notUsedVars.reduce((acc, curr) => `${acc} \n ${curr}`, '')}
        `);
  }
}

function getAllCssVariables(content: string): string[] {
  const cssVariablesRegex = /(--(?!semantic)[\w-]+)/g;
  const allMatches = Array.from(content.match(cssVariablesRegex) || []);

  return Array.from(new Set<string>(allMatches));
}

await check();
