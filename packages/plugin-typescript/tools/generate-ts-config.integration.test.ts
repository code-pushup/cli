import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readTextFile } from '@code-pushup/utils';
import { prepareTsConfigFileContent } from './generate-ts-config.js';

describe('prepareTsConfigFileContent', () => {
  it('should parse tsconfig.json created from init command', async () => {
    const testContent = await readTextFile(
      join('./packages/plugin-typescript/mocks/fixtures', 'tsconfig.init.json'),
    );
    expect(prepareTsConfigFileContent(testContent)).toMatchSnapshot();
  });
});
