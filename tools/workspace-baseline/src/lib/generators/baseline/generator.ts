import {
  type Tree,
  createProjectGraphAsync,
  formatFiles,
  logger,
} from '@nx/devkit';
import * as path from 'node:path';
import type { BaselineGeneratorOptions } from './schema';
import {
  createBaselineFile,
  createConstantsFile,
  filterProjectsByNxFilter,
  findTsconfigFilesInProject,
} from './utils';

export async function baselineGenerator(
  tree: Tree,
  options: BaselineGeneratorOptions,
) {
  const {
    projectsFilter = [],
    configMatcher = 'tsconfig*.json',
    skipFormat,
    skipExisting = false,
  } = options;

  // Get project graph
  const graph = await createProjectGraphAsync();

  // Filter projects
  const projects = filterProjectsByNxFilter(graph, projectsFilter);

  if (projects.length === 0) {
    logger.warn('No projects found matching the filter criteria');
    return;
  }

  logger.info(`Found ${projects.length} project(s) matching filter criteria`);

  // Determine baseline directory from env var or default
  // Tree.write() expects paths relative to workspace root
  const baselineDir =
    process.env.BASELINE_DIR || 'tools/workspace-baseline/baseline';

  // Ensure baseline directory exists (Tree will create parent directories automatically)
  // Check if baseline directory exists, if not log a warning
  if (!tree.exists(baselineDir)) {
    logger.warn(
      `Baseline directory does not exist: ${baselineDir}. Files will be created.`,
    );
  }

  // Create constants file first (if it doesn't exist)
  const constantsPath = createConstantsFile(tree, baselineDir, skipExisting);
  if (constantsPath) {
    logger.info(`Created constants file: ${constantsPath}`);
  }

  const createdBaselines: string[] = [];

  // Process each project
  for (const project of projects) {
    const projectRoot = project.data.root;

    if (!projectRoot) {
      logger.warn(`Project ${project.name} has no root directory`);
      continue;
    }

    // Find all tsconfig files in the project
    const tsconfigFiles = findTsconfigFilesInProject(
      tree,
      projectRoot,
      configMatcher,
    );

    if (tsconfigFiles.length === 0) {
      logger.debug(
        `No tsconfig files found in project ${project.name} matching pattern "${configMatcher}"`,
      );
      continue;
    }

    logger.info(
      `Found ${tsconfigFiles.length} tsconfig file(s) in project ${project.name}`,
    );

    // Create baseline file for each tsconfig
    for (const tsconfigFile of tsconfigFiles) {
      try {
        const tsconfigPath = path.join(projectRoot, tsconfigFile);
        const result = createBaselineFile(
          tree,
          tsconfigFile,
          tsconfigPath,
          baselineDir,
          skipExisting,
        );
        if (result) {
          createdBaselines.push(result.path);
          if (result.reused) {
            logger.info(
              `Reused existing baseline file: ${result.path} for ${tsconfigFile} (content match)`,
            );
          } else {
            logger.info(
              `Created baseline file: ${result.path} for ${tsconfigFile}`,
            );
          }
        } else {
          logger.debug(
            `Skipped baseline file creation for ${tsconfigFile} (skipExisting flag set)`,
          );
        }
      } catch (error) {
        logger.error(
          `Failed to create baseline file for ${tsconfigFile}: ${error}`,
        );
      }
    }
  }

  if (createdBaselines.length === 0) {
    logger.warn('No baseline files were created');
    return;
  }

  logger.info(`Created ${createdBaselines.length} baseline file(s)`);

  // Format files if not skipped
  if (skipFormat !== true) {
    await formatFiles(tree);
  } else {
    logger.info('Skip formatting files');
  }
}

export default baselineGenerator;
