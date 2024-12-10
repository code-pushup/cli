import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import { initGitRepo } from '@code-pushup/test-utils';
import { type ChangedFiles, listChangedFiles } from './git.js';

describe('git diff', () => {
  const baseDir = join('tmp', 'ci', 'git-utils-test');

  let git: SimpleGit;

  beforeAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
    git = await initGitRepo(simpleGit, { baseDir });

    await writeFile(join(baseDir, 'LICENSE'), 'MIT License\n\n...');
    await writeFile(
      join(baseDir, 'index.js'),
      'export const sum = values => values.reduce((acc, val) => acc + val, 0)\n',
    );
    await writeFile(
      join(baseDir, 'package.json'),
      JSON.stringify(
        { name: 'sum', type: 'module', main: 'index.js' },
        null,
        2,
      ),
    );
    await git.add('.');
    await git.commit('Initial commit');

    await git.checkoutLocalBranch('testing');
    await mkdir(join(baseDir, 'src'));
    await mkdir(join(baseDir, 'test'));
    await rename(join(baseDir, 'index.js'), join(baseDir, 'src/index.js'));
    await writeFile(
      join(baseDir, 'test/index.test.js'),
      [
        "import assert from 'node:assert'",
        "import test from 'node:test'",
        "import { sum } from '../src/index.js'",
        '',
        "test('should sum all numbers', () => {",
        '  assert.strictEqual(sum([1, 2, 3, 4]), 10)',
        '})',
      ]
        .map(line => `${line}\n`)
        .join(''),
    );
    await writeFile(
      join(baseDir, 'package.json'),
      JSON.stringify(
        {
          name: 'sum',
          type: 'module',
          main: 'src/index.js',
          scripts: { test: 'node --test' },
        },
        null,
        2,
      ),
    );
    await git.add('.');
    await git.commit('Unit test');
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('should list added, modified and renamed files', async () => {
    await expect(
      listChangedFiles({ base: 'main', head: 'testing' }, git),
    ).resolves.toEqual({
      'package.json': {
        lineChanges: [
          { prev: { line: 4, count: 1 }, curr: { line: 4, count: 4 } },
        ],
      },
      'src/index.js': {
        originalFile: 'index.js',
        lineChanges: [],
      },
      'test/index.test.js': {
        lineChanges: [
          { prev: { line: 0, count: 0 }, curr: { line: 1, count: 7 } },
        ],
      },
    } satisfies ChangedFiles);
  });
});
