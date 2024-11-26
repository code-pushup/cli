export const nxTargetProject = () => {
  const project = process.env['NX_TASK_TARGET_PROJECT'];
  if (project == null) {
    throw new Error(
      'Process environment variable NX_TASK_TARGET_PROJECT is undefined.',
    );
  }
  return project;
};
