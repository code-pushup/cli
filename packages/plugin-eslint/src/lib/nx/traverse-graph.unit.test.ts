import type { ProjectGraph } from '@nx/devkit';
import { findAllDependencies } from './traverse-graph.js';

describe('findAllDependencies', () => {
  const mockProjectGraph = (dependencies: ProjectGraph['dependencies']) =>
    ({ dependencies }) as ProjectGraph;

  it('should return empty array when a project has no dependencies', () => {
    expect(
      findAllDependencies('utils', mockProjectGraph({ utils: [] })),
    ).toEqual(new Set());
  });

  it('should include direct dependencies', () => {
    expect(
      findAllDependencies(
        'app',
        mockProjectGraph({
          app: [
            { source: 'app', target: 'models', type: 'static' },
            { source: 'app', target: 'utils', type: 'static' },
          ],
        }),
      ),
    ).toEqual(new Set(['models', 'utils']));
  });

  it('should include indirect dependencies', () => {
    expect(
      findAllDependencies(
        'a',
        mockProjectGraph({
          a: [{ source: 'a', target: 'b', type: 'static' }],
          b: [{ source: 'b', target: 'c', type: 'static' }],
          c: [{ source: 'c', target: 'd', type: 'static' }],
          d: [],
        }),
      ),
    ).toEqual(new Set(['b', 'c', 'd']));
  });

  it('should handle direct circular dependencies', () => {
    expect(
      findAllDependencies(
        'a',
        mockProjectGraph({
          a: [{ source: 'a', target: 'b', type: 'static' }],
          b: [{ source: 'b', target: 'a', type: 'static' }],
        }),
      ),
    ).toEqual(new Set(['b']));
  });

  it('should handle indirect circular dependencies', () => {
    expect(
      findAllDependencies(
        'a',
        mockProjectGraph({
          a: [{ source: 'a', target: 'b', type: 'static' }],
          b: [{ source: 'b', target: 'c', type: 'static' }],
          c: [{ source: 'c', target: 'a', type: 'static' }],
        }),
      ),
    ).toEqual(new Set(['b', 'c']));
  });
});
