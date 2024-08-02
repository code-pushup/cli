export const NX_JSON_FILENAME = 'nx.json';
export const NX_JSON_CONTENT = JSON.stringify({
  $schema: './node_modules/nx/schemas/nx-schema.json',
  releaseTagPattern: 'v{version}',
  targetDefaults: {},
});
export const PROJECT_NAME = 'source-root';
export const PROJECT_JSON_FILENAME = 'project.json';
export const PROJECT_JSON_CONTENT = JSON.stringify({
  $schema: 'node_modules/nx/schemas/project-schema.json',
  name: PROJECT_NAME,
});
