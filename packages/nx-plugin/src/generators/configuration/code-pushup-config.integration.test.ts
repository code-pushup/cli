import * as devKit from '@nx/devkit';
import { formatFiles } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateCodePushupConfig } from './code-pushup-config.js';

describe('generateCodePushupConfig options', () => {
  let tree: devKit.Tree;
  const project = 'test-app';
  const projectRoot = path.join('libs', project);

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    devKit.addProjectConfiguration(tree, project, {
      root: 'test-app',
    });
  });

  it('should create code-pushup.config.ts with options in tree', async () => {
    generateCodePushupConfig(tree, projectRoot, {
      fileImports: 'import type { CoreConfig } from "../dist/packages/models";',
      persist: { filename: 'report-123' },
      upload: { apiKey: '123' },
      plugins: [
        {
          fileImports: 'import * as myPlugin from "my-plugin";',
          codeStrings: 'myPlugin({ timeout: 42})',
        },
      ],
      categories: [
        {
          fileImports: 'import {myPluginCategory} from "my-plugin";',
          codeStrings: 'myPluginCategory()',
        },
      ],
    });

    await formatFiles(tree);

    expect(
      tree.read(path.join(projectRoot, 'code-pushup.config.ts'))?.toString(),
    ).toMatchFileSnapshot('__snapshots__/root-code-pushup.config.ts');
  });
});
