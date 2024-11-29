export {
  // eslint-disable-next-line deprecation/deprecation
  eslintConfigFromNxProjects,
  eslintConfigFromAllNxProjects,
} from './find-all-projects.js';
export { eslintConfigFromNxProject } from './find-project-without-deps.js';
export { eslintConfigFromNxProjectAndDeps } from './find-project-with-deps.js';
