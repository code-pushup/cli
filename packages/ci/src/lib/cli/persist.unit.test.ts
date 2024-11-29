import { join } from 'node:path';
import {
  type PersistedCliFiles,
  findPersistedFiles,
  persistCliOptions,
  persistedCliFiles,
} from './persist.js';

describe('persistCliOptions', () => {
  it('should create CLI arguments for standalone project', () => {
    expect(
      persistCliOptions({
        directory: process.cwd(),
        output: '.code-pushup',
      }),
    ).toEqual([
      `--persist.outputDir=${join(process.cwd(), '.code-pushup')}`,
      '--persist.filename=report',
      '--persist.format=json',
      '--persist.format=md',
    ]);
  });

  it('should create CLI arguments for monorepo project', () => {
    expect(
      persistCliOptions({
        project: 'utils',
        directory: process.cwd(),
        output: '.code-pushup',
      }),
    ).toEqual([
      `--persist.outputDir=${join(process.cwd(), '.code-pushup')}`,
      '--persist.filename=utils-report',
      '--persist.format=json',
      '--persist.format=md',
    ]);
  });
});

describe('persistedCliFiles', () => {
  it('should determine persisted files for standalone report', () => {
    expect(
      persistedCliFiles({
        directory: process.cwd(),
        output: '.code-pushup',
      }),
    ).toEqual<PersistedCliFiles>({
      jsonFilePath: join(process.cwd(), '.code-pushup/report.json'),
      mdFilePath: join(process.cwd(), '.code-pushup/report.md'),
      artifactData: {
        rootDir: join(process.cwd(), '.code-pushup'),
        files: [
          join(process.cwd(), '.code-pushup/report.json'),
          join(process.cwd(), '.code-pushup/report.md'),
        ],
      },
    });
  });

  it('should determine persisted files for monorepo report', () => {
    expect(
      persistedCliFiles({
        directory: process.cwd(),
        output: '.code-pushup/auth',
        project: 'auth',
      }),
    ).toEqual<PersistedCliFiles>({
      jsonFilePath: join(process.cwd(), '.code-pushup/auth/auth-report.json'),
      mdFilePath: join(process.cwd(), '.code-pushup/auth/auth-report.md'),
      artifactData: {
        rootDir: join(process.cwd(), '.code-pushup/auth'),
        files: [
          join(process.cwd(), '.code-pushup/auth/auth-report.json'),
          join(process.cwd(), '.code-pushup/auth/auth-report.md'),
        ],
      },
    });
  });

  it('should determine persisted files for diff in Markdown format only', () => {
    expect(
      persistedCliFiles({
        directory: process.cwd(),
        output: '.code-pushup',
        isDiff: true,
        formats: ['md'],
      }),
    ).toEqual<PersistedCliFiles<'md'>>({
      mdFilePath: join(process.cwd(), '.code-pushup/report-diff.md'),
      artifactData: {
        rootDir: join(process.cwd(), '.code-pushup'),
        files: [join(process.cwd(), '.code-pushup/report-diff.md')],
      },
    });
  });
});

describe('findPersistedFiles', () => {
  it('should find report files in artifact data for standalone project', () => {
    expect(
      findPersistedFiles({
        rootDir: join(process.cwd(), '.code-pushup'),
        files: [
          'report-diff.json',
          'report-diff.md',
          'report.json',
          'report.md',
        ],
      }),
    ).toEqual<PersistedCliFiles>({
      jsonFilePath: join(process.cwd(), '.code-pushup/report.json'),
      mdFilePath: join(process.cwd(), '.code-pushup/report.md'),
      artifactData: {
        rootDir: join(process.cwd(), '.code-pushup'),
        files: [
          join(process.cwd(), '.code-pushup/report.json'),
          join(process.cwd(), '.code-pushup/report.md'),
        ],
      },
    });
  });

  it('should find report files in artifact data for monorepo project', () => {
    expect(
      findPersistedFiles({
        rootDir: join(process.cwd(), '.code-pushup'),
        files: [
          'backend-report-diff.json',
          'backend-report-diff.md',
          'backend-report.json',
          'backend-report.md',
          'frontend-report-diff.json',
          'frontend-report-diff.md',
          'frontend-report.json',
          'frontend-report.md',
          'report-diff.md',
        ],
        project: 'frontend',
      }),
    ).toEqual<PersistedCliFiles>({
      jsonFilePath: join(process.cwd(), '.code-pushup/frontend-report.json'),
      mdFilePath: join(process.cwd(), '.code-pushup/frontend-report.md'),
      artifactData: {
        rootDir: join(process.cwd(), '.code-pushup'),
        files: [
          join(process.cwd(), '.code-pushup/frontend-report.json'),
          join(process.cwd(), '.code-pushup/frontend-report.md'),
        ],
      },
    });
  });
});
