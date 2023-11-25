import { unlink } from 'fs/promises';
import { vol } from 'memfs';
import { basename, join } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executePlugin } from '../../../packages/core/src';
import {
  categoryRefSchema,
  pluginConfigSchema,
} from '../../../packages/models/src';
import { MEMFS_VOLUME, categoryConfig } from '../../../packages/models/test';
import { formatBytes } from '../../../packages/utils/src';
import {
  PluginOptions,
  assertFileSize,
  audits,
  create,
  errorMessage,
  fileSizeIssues,
  infoMessage,
  recommendedRefs,
  runnerFunction,
  scoreFilesizeAudit,
  pluginSlug as slug,
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
    obj: {
      test: 42,
    },
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

const file = 'test.js';
const infoMsg = (size: number) => infoMessage(file, size);

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
  ])('should return error message', (size, budget) => {
    const sizeDifference = size - budget;
    expect(errorMessage('test.js', size, budget)).toBe(
      `File ${file} is ${size} B this is ${1} B too big. (budget: ${budget} B)`,
    );
  });
});

describe('assertFileSize', () => {
  it.each([[-1], [0], [1]])(
    'should return a informative Issue without budgets (size: %s)',
    size => {
      expect(assertFileSize(file, size)).toEqual({
        message: infoMsg(size),
        severity: 'info',
        source: { file },
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
      expect(assertFileSize(file, size, budget)).toEqual({
        message: infoMsg(size),
        severity: 'info',
        source: { file },
      });
    },
  );

  it.each([[1, 0]])(
    'should return error Issue with budgets exceeding (size: %s, budget: %s)',
    (size, budget) => {
      expect(assertFileSize(file, size, budget)).toEqual({
        message: errorMessage(file, size, budget),
        severity: 'error',
        source: { file },
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
    expect(
      fileSizeIssues({
        directory: outputDir,
      }),
    ).resolves.toEqual(
      expect.arrayContaining(
        ['/test/project.json', '/test/src/test.js', '/test/docs/README.md'].map(
          file => ({
            message: expect.any(String),
            severity: expect.any(String),
            source: {
              file,
            },
          }),
        ),
      ),
    );
  });

  it('should list files matching a pattern', async () => {
    expect(
      fileSizeIssues({
        directory: outputDir,
        pattern: /\.js$/,
      }),
    ).resolves.toEqual([
      {
        message: expect.any(String),
        severity: expect.any(String),
        source: {
          file: '/test/src/test.js',
        },
      },
    ]);
  });

  it('should assert files that are over budget', async () => {
    expect(
      fileSizeIssues({
        directory: outputDir,
        budget: 25,
      }),
    ).resolves.toEqual([
      {
        message: expect.any(String),
        severity: 'info',
        source: {
          file: '/test/docs/README.md',
        },
      },
      {
        message: expect.any(String),
        severity: 'error',
        source: {
          file: '/test/project.json',
        },
      },
      {
        message: expect.any(String),
        severity: 'error',
        source: {
          file: '/test/src/test.js',
        },
      },
    ]);
  });

  it('should assert files that are over budget and match the pattern', async () => {
    expect(
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
          file: '/test/src/test.js',
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

  it('should return pass if no files are given and pass', async function () {
    vol.reset();
    // create empty directory
    vol.fromJSON(
      {
        'm.js': '',
      },
      outputDir,
    );
    await unlink(join(outputDir, 'm.js'));

    expect(
      runnerFunction({
        directory: outputDir,
      }),
    ).resolves.toEqual([filesizeAuditOutputBase]);
  });

  it('should return issues if files are given and pass', function () {
    expect(
      runnerFunction({
        directory: outputDir,
      }),
    ).resolves.toEqual([
      {
        ...filesizeAuditOutputBase,
        details: {
          issues: expect.any(Array),
        },
      },
    ]);
  });

  it('should have number of files given as value', function () {
    expect(
      runnerFunction({
        directory: outputDir,
      }),
    ).resolves.toEqual([
      {
        ...filesizeAuditOutputBase,
        displayValue: '0 files oversize',
        value: 0,
        score: expect.any(Number),
        details: {
          issues: expect.any(Array),
        },
      },
    ]);
  });

  it('should have files that are matching the pattern as issues', function () {
    expect(
      runnerFunction({
        directory: outputDir,
        pattern: /\.js$/,
      }),
    ).resolves.toEqual([
      {
        ...filesizeAuditOutputBase,
        details: {
          issues: [
            {
              source: {
                file: '/test/src/test.js',
              },
              message: expect.any(String),
              severity: expect.any(String),
            },
          ],
        },
        displayValue: expect.any(String),
        value: expect.any(Number),
        score: expect.any(Number),
      },
    ]);
  });

  it('should have number of files that are over budget as value and listed in issues', function () {
    expect(
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
                'File test.js is 154 B this is 26 B too big. (budget: 128 B)',
              severity: 'error',
              source: {
                file: '/test/src/test.js',
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
  ])('should have correct score', (budget, value, score) => {
    expect(
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

describe('create', () => {
  const baseOptions: PluginOptions = {
    directory: outputDir,
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

  it('should return valid PluginConfig', async () => {
    const pluginConfig = await create(baseOptions);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual({
      audits,
      description:
        'A plugin to measure and assert filesize of files in a directory.',
      icon: 'javascript',
      runner: expect.any(Function),
      slug,
      title: 'File Size',
    });
  });

  it('should return PluginConfig that executes correctly', async () => {
    const pluginConfig = await create(baseOptions);
    expect(executePlugin(pluginConfig)).resolves.toMatchObject({
      description:
        'A plugin to measure and assert filesize of files in a directory.',
      slug,
      title: 'File Size',
      duration: expect.any(Number),
      date: expect.any(String),
      audits: expect.any(Array),
    });
  });

  it('should use pattern', async () => {
    const pluginConfig = await create({
      ...baseOptions,
      pattern: /\.js$/,
    });
    const { audits } = await executePlugin(pluginConfig);

    expect(audits.length).toBe(1);
    expect(audits[0].score).toBe(1);
    expect(audits[0].details.issues.length).toBe(1);
  });

  it('should use budget', async () => {
    const pluginConfig = await create({
      ...baseOptions,
      budget: 0,
    });
    const { audits } = await executePlugin(pluginConfig);

    expect(audits.length).toBe(1);
    expect(audits[0].score).toBe(0);
    expect(audits[0].details.issues.length).toBe(2);
  });
});

describe('recommendedRefs', () => {
  it.each(recommendedRefs)(
    'should be a valid category reference',
    categoryRef => {
      expect(() => categoryRefSchema.parse(categoryRef)).not.toThrow();
    },
  );
});
