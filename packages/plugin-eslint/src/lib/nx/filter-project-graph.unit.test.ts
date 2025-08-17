import { describe, expect, it } from 'vitest';
import { toProjectGraph } from '@code-pushup/test-utils';
import { filterProjectGraph } from './filter-project-graph.js';

describe('filterProjectGraph', () => {
  it('should exclude specified projects from nodes', () => {
    const projectGraph = toProjectGraph([
      { name: 'client', type: 'app', data: { root: 'apps/client' } },
      { name: 'server', type: 'app', data: { root: 'apps/server' } },
      { name: 'models', type: 'lib', data: { root: 'libs/models' } },
    ]);

    const filteredGraph = filterProjectGraph(projectGraph, ['client']);

    expect(Object.keys(filteredGraph.nodes)).not.toContain('client');
    expect(Object.keys(filteredGraph.nodes)).toContain('server');
    expect(Object.keys(filteredGraph.nodes)).toContain('models');
  });

  it('should exclude dependencies of excluded projects', () => {
    const projectGraph = toProjectGraph(
      [
        { name: 'client', type: 'app', data: { root: 'apps/client' } },
        { name: 'server', type: 'app', data: { root: 'apps/server' } },
        { name: 'models', type: 'lib', data: { root: 'libs/models' } },
      ],
      {
        client: ['server'],
        server: ['models'],
      },
    );

    const filteredGraph = filterProjectGraph(projectGraph, ['client']);

    expect(Object.keys(filteredGraph.dependencies)).not.toContain('client');
    expect(filteredGraph.dependencies['server']).toEqual([
      { source: 'server', target: 'models', type: 'static' },
    ]);
  });

  it('should include all projects if exclude list is empty', () => {
    const projectGraph = toProjectGraph([
      { name: 'client', type: 'app', data: { root: 'apps/client' } },
      { name: 'server', type: 'app', data: { root: 'apps/server' } },
      { name: 'models', type: 'lib', data: { root: 'libs/models' } },
    ]);

    const filteredGraph = filterProjectGraph(projectGraph, []);

    expect(Object.keys(filteredGraph.nodes)).toContain('client');
    expect(Object.keys(filteredGraph.nodes)).toContain('server');
    expect(Object.keys(filteredGraph.nodes)).toContain('models');
  });

  it('should ignore non-existent projects in the exclude list', () => {
    const projectGraph = toProjectGraph([
      { name: 'client', type: 'app', data: { root: 'apps/client' } },
      { name: 'server', type: 'app', data: { root: 'apps/server' } },
      { name: 'models', type: 'lib', data: { root: 'libs/models' } },
    ]);

    const filteredGraph = filterProjectGraph(projectGraph, ['non-existent']);

    expect(Object.keys(filteredGraph.nodes)).toContain('client');
    expect(Object.keys(filteredGraph.nodes)).toContain('server');
    expect(Object.keys(filteredGraph.nodes)).toContain('models');
  });
});
