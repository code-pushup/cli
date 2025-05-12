import path from 'node:path';
import type { CoverageTree } from '@code-pushup/models';
import { type FileCoverage, filesCoverageToTree } from './coverage-tree.js';

describe('filesCoverageToTree', () => {
  it('should convert list of files to folder structure', () => {
    const mockCoverage: Omit<FileCoverage, 'path'> = {
      covered: 0,
      total: 0,
      missing: [],
    };
    const files: FileCoverage[] = [
      {
        ...mockCoverage,
        path: path.join(process.cwd(), 'src', 'components', 'CreateTodo.jsx'),
      },
      {
        ...mockCoverage,
        path: path.join(process.cwd(), 'src', 'components', 'TodoFilter.jsx'),
      },
      {
        ...mockCoverage,
        path: path.join(process.cwd(), 'src', 'components', 'TodoList.jsx'),
      },
      {
        ...mockCoverage,
        path: path.join(process.cwd(), 'src', 'hooks', 'useTodos.js'),
      },
      {
        ...mockCoverage,
        path: path.join(process.cwd(), 'src', 'App.jsx'),
      },
    ];

    expect(filesCoverageToTree(files, process.cwd())).toEqual(
      expect.objectContaining({
        root: expect.objectContaining({
          name: '.',
          children: [
            expect.objectContaining({
              name: 'src',
              children: [
                expect.objectContaining({
                  name: 'components',
                  children: [
                    expect.objectContaining({ name: 'CreateTodo.jsx' }),
                    expect.objectContaining({ name: 'TodoFilter.jsx' }),
                    expect.objectContaining({ name: 'TodoList.jsx' }),
                  ],
                }),
                expect.objectContaining({
                  name: 'hooks',
                  children: [expect.objectContaining({ name: 'useTodos.js' })],
                }),
                expect.objectContaining({ name: 'App.jsx' }),
              ],
            }),
          ],
        }),
      }),
    );
  });

  it('should calculate files and folders coverage', () => {
    const files: FileCoverage[] = [
      {
        path: path.join(process.cwd(), 'src', 'components', 'CreateTodo.jsx'),
        covered: 25,
        total: 25,
        missing: [],
      },
      {
        path: path.join(process.cwd(), 'src', 'components', 'TodoFilter.jsx'),
        covered: 40,
        total: 50,
        missing: [{ startLine: 11, endLine: 21 }],
      },
      {
        path: path.join(process.cwd(), 'src', 'components', 'TodoList.jsx'),
        covered: 25,
        total: 25,
        missing: [],
      },
      {
        path: path.join(process.cwd(), 'src', 'hooks', 'useTodos.js'),
        covered: 0,
        total: 60,
        missing: [{ startLine: 1, endLine: 60 }],
      },
      {
        path: path.join(process.cwd(), 'src', 'App.jsx'),
        covered: 0,
        total: 20,
        missing: [{ startLine: 1, endLine: 20 }],
      },
    ];

    expect(filesCoverageToTree(files, process.cwd())).toEqual<CoverageTree>({
      type: 'coverage',
      root: {
        name: '.',
        values: { coverage: 0.5 }, // 90 out of 180
        children: [
          {
            name: 'src',
            values: { coverage: 0.5 }, // 90 out of 180
            children: [
              {
                name: 'components',
                values: { coverage: 0.9 }, // 90 out of 100
                children: [
                  {
                    name: 'CreateTodo.jsx',
                    values: {
                      coverage: 1, // 25 out of 25
                      missing: [],
                    },
                  },
                  {
                    name: 'TodoFilter.jsx',
                    values: {
                      coverage: 0.8, // 40 out of 50
                      missing: [{ startLine: 11, endLine: 21 }],
                    },
                  },
                  {
                    name: 'TodoList.jsx',
                    values: {
                      coverage: 1, // 25 out of 25
                      missing: [],
                    },
                  },
                ],
              },
              {
                name: 'hooks',
                values: { coverage: 0 }, // 0 out of 60
                children: [
                  {
                    name: 'useTodos.js',
                    values: {
                      coverage: 0, // 0 out of 60
                      missing: [{ startLine: 1, endLine: 60 }],
                    },
                  },
                ],
              },
              {
                name: 'App.jsx',
                values: {
                  coverage: 0, // 0 out of 20
                  missing: [{ startLine: 1, endLine: 20 }],
                },
              },
            ],
          },
        ],
      },
    });
  });

  it('should include title if provided', () => {
    expect(filesCoverageToTree([], process.cwd(), 'Branch coverage')).toEqual(
      expect.objectContaining({ title: 'Branch coverage' }),
    );
  });
});
