// @ts-check
import { createProjectGraphAsync } from '@nx/devkit';

const graph = await createProjectGraphAsync({
  exitOnError: true,
  resetDaemonClient: true,
});

const projects = Object.values(graph.nodes)
  .filter(project => project.data.root === `packages/${project.name}`)
  .sort((a, b) => a.name.localeCompare(b.name));
const targets = ['unit-test', 'int-test'];
const excludes = targets.flatMap(target =>
  projects
    .filter(project => project.data.targets?.[target] == null)
    .map(project => ({ project: project.name, target })),
);

const matrix = {
  project: projects.map(project => project.name),
  target: targets,
  exclude: excludes,
};

console.info(JSON.stringify(matrix));
