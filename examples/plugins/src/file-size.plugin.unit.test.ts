import { vol } from 'memfs';
import { unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import { formatBytes } from '@code-pushup/utils';
import {
  assertFileSize,
  errorMessage,
  fileSizeIssues,
  infoMessage,
  runnerFunction,
  scoreFilesizeAudit,
} from './file-size.plugin';

// Mock file system API's
vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

const outputDir = MEMFS_VOLUME;
const projectJson = JSON.stringify(
  {
    test: 42,
    arr: [1, 2, 3],
    obj: { test: 42 },
  },
  null,
  2,
);
const testJs = `
    const str = 'Hello World'
    const num = 42;
    const obj = ${projectJson};
  `;
const readmeMd = '# Docs';

const testFile = 'test.js';

describe('infoMessage', () => {
  it.each([['index.js'], [join('src', 'index.js')]])(
    'should return info message',
    file => {
      expect(infoMessage(file, 12)).toBe(
        `File ${basename(file)} is OK. (size: ${formatBytes(12)})`,
      );
    },
  );
});

describe('errorMessage', () => {
  it.each([
    [1, 0],
    [2, 1],
  ])(
    'should return error message for size %i with budget %i',
    (size, budget) => {
      expect(errorMessage('test.js', size, budget)).toBe(
        `File ${testFile} has ${size} B, this is ${1} B too big. (budget: ${budget} B)`,
      );
    },
  );
});

describe('assertFileSize', () => {
  it.each([[-1], [0], [1]])(
    'should return a informative Issue without budgets (size: %s)',
    size => {
      expect(assertFileSize(testFile, size)).toEqual({
        message: infoMessage(testFile, size),
        severity: 'info',
        source: { file: testFile },
      });
    },
  );

  it.each([
    [0, 0],
    [0, 1],
    [1, 1],
  ])(
    'should return a informative Issue with budgets not exceeding (size: %s, budget: %s)',
    (size, budget) => {
      expect(assertFileSize(testFile, size, budget)).toEqual({
        message: infoMessage(testFile, size),
        severity: 'info',
        source: { file: testFile },
      });
    },
  );

  it.each([[1, 0]])(
    'should return error Issue with budgets exceeding (size: %s, budget: %s)',
    (size, budget) => {
      expect(assertFileSize(testFile, size, budget)).toEqual({
        message: errorMessage(testFile, size, budget),
        severity: 'error',
        source: { file: testFile },
      });
    },
  );
});

describe('scoreFilesizeAudit', () => {
  it.each([
    [-1, -1, 1],
    [0, -1, 1],
    [0, 0, 1],
    [1, 0, 1],
    [2, 1, 0.5],
    [2, 2, 0],
  ])(
    'should return correct score (files: %s, errors: %s, score: %s)',
    (files, errors, score) => {
      expect(scoreFilesizeAudit(files, errors)).toBe(score);
    },
  );
});

describe('fileSizePlugin', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON(
      {
        'project.json': projectJson,
        'src/test.js': testJs,
        'docs/README.md': readmeMd,
      },
      outputDir,
    );
  });

  it('should list all files', async () => {
    await expect(
      fileSizeIssues({
        directory: outputDir,
      }),
    ).resolves.toEqual(
      expect.arrayContaining(
        ['project.json', 'test.js', 'README.md'].map(f => ({
          message: expect.any(String),
          severity: expect.any(String),
          source: {
            file: expect.stringContaining(f),
          },
        })),
      ),
    );
  });

  it('should list files matching a pattern', async () => {
    await expect(
      fileSizeIssues({
        directory: outputDir,
        pattern: /\.js$/,
      }),
    ).resolves.toEqual([
      {
        message: expect.any(String),
        severity: expect.any(String),
        source: {
          file: expect.stringContaining('test.js'),
        },
      },
    ]);
  });

  it('should assert files that are over budget', async () => {
    await expect(
      fileSizeIssues({
        directory: outputDir,
        budget: 25,
      }),
    ).resolves.toEqual(
      expect.arrayContaining([
        {
          message: expect.any(String),
          severity: 'info',
          source: {
            file: expect.stringContaining('README.md'),
          },
        },
        {
          message: expect.any(String),
          severity: 'error',
          source: {
            file: expect.stringContaining('project.json'),
          },
        },
        {
          message: expect.any(String),
          severity: 'error',
          source: {
            file: expect.stringContaining('test.js'),
          },
        },
      ]),
    );
  });

  it('should assert files that are over budget and match the pattern', async () => {
    await expect(
      fileSizeIssues({
        directory: outputDir,
        budget: 1,
        pattern: /\.js$/,
      }),
    ).resolves.toEqual([
      {
        message: expect.any(String),
        severity: 'error',
        source: {
          file: expect.stringContaining('test.js'),
        },
      },
    ]);
  });
});

describe('runnerFunction', () => {
  const filesizeAuditOutputBase = {
    displayValue: '0 files oversize',
    score: 1,
    slug: 'file-size-check',
    value: 0,
  };

  beforeEach(() => {
    vol.reset();
    vol.fromJSON(
      {
        'project.json': projectJson,
        'src/test.js': testJs,
      },
      outputDir,
    );
  });

  it('should return pass if no files are given and pass', async () => {
    vol.reset();
    // create empty directory
    vol.fromJSON(
      {
        'm.js': '',
      },
      outputDir,
    );
    await unlink(join(outputDir, 'm.js'));

    await expect(
      runnerFunction({
        directory: outputDir,
      }),
    ).resolves.toEqual([filesizeAuditOutputBase]);
  });

  it('should return issues if files are given and pass', async () => {
    await expect(
      runnerFunction({
        directory: outputDir,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        ...filesizeAuditOutputBase,
        details: {
          issues: expect.any(Array),
        },
      }),
    ]);
  });

  it('should have number of files given as value', async () => {
    await expect(
      runnerFunction({
        directory: outputDir,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        displayValue: '0 files oversize',
        value: 0,
      }),
    ]);
  });

  it('should have files in issues that are matching the pattern as issues', async () => {
    await expect(
      runnerFunction({
        directory: outputDir,
        pattern: /\.js$/,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        details: {
          issues: [
            expect.objectContaining({
              source: {
                file: expect.stringContaining('test.js'),
              },
            }),
          ],
        },
      }),
    ]);
  });

  it('should have number of files that are over budget as value and listed in issues', async () => {
    await expect(
      runnerFunction({
        directory: outputDir,
        budget: 128,
      }),
    ).resolves.toEqual([
      {
        ...filesizeAuditOutputBase,
        displayValue: '1 file oversize',
        value: 1,
        score: expect.any(Number),
        details: {
          issues: expect.arrayContaining([
            {
              message:
                'File test.js has 154 B, this is 26 B too big. (budget: 128 B)',
              severity: 'error',
              source: {
                file: expect.stringContaining('test.js'),
              },
            },
          ]),
        },
      },
    ]);
  });

  it.each([
    [0, 2, 0],
    [128, 1, 0.5],
    [1000, 0, 1],
  ])('should have correct score', async (budget, value, score) => {
    await expect(
      runnerFunction({
        directory: outputDir,
        budget,
      }),
    ).resolves.toEqual([
      {
        ...filesizeAuditOutputBase,
        displayValue: expect.stringContaining(value.toString()),
        value,
        score,
        details: {
          issues: expect.any(Array),
        },
      },
    ]);
  });
});
