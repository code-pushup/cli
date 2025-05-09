import path from 'node:path';
import { filesCoverageToTree } from './coverage-tree.js';

describe('filesCoverageToTree', () => {
  it('should convert list of files to folder structure', () => {
    const mockCoverage = { hits: 0, total: 0, missing: [] };
    const files = [
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
});
