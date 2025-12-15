#!/usr/bin/env node
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const TEMP_GRAPH_FILE = '/tmp/nx-graph-validation.json';
const TEMP_CONFIG_FILE = '/tmp/cp-config-validation.json';
const TARGET_NAME = 'code-pushup';

function log(message) {
  console.log(message);
}

async function getProjectGraph() {
  try {
    await execAsync(
      `npx nx graph --file=${TEMP_GRAPH_FILE} --open=false 2>/dev/null`,
      { timeout: 30_000 },
    );

    const graphJson = await fs.readFile(TEMP_GRAPH_FILE, 'utf-8');
    const parsed = JSON.parse(graphJson);
    return parsed;
  } catch (error) {
    console.error(`Failed to generate project graph: ${error.message}`);
    throw error;
  }
}

async function getProjectConfig(projectRoot) {
  const configPath = path.join(projectRoot, 'code-pushup.config.ts');
  try {
    await fs.access(configPath);
  } catch {
    return null;
  }

  try {
    await execAsync(
      `npx @code-pushup/cli print-config --config ${configPath} --output ${TEMP_CONFIG_FILE} 2>/dev/null`,
      { timeout: 15000 },
    );
    const configJson = await fs.readFile(TEMP_CONFIG_FILE, 'utf-8');
    return JSON.parse(configJson);
  } catch (error) {
    return null;
  }
}

async function getProjectJsonTargets(projectRoot) {
  const projectJsonPath = path.join(projectRoot, 'project.json');
  const content = await fs.readFile(projectJsonPath, 'utf-8');
  const projectJson = JSON.parse(content);
  return projectJson.targets || {};
}

function validateProject(projectName, projectNode, config, projectRoot) {
  if (!config) {
    return { valid: true, issues: [] };
  }

  const plugins = config.plugins || [];
  const targetNames = Object.keys(projectNode.data.targets || {});
  const projectJsonTargets = getProjectJsonTargets(projectRoot);
  const projectJsonTargetNames = Object.keys(projectJsonTargets);

  const issues = [];

  // Check 1: All plugins have corresponding targets
  const missingPlugins = plugins.filter(plugin => {
    const targetName = `${TARGET_NAME}-${plugin.slug}`;
    return !targetNames.includes(targetName);
  });

  if (missingPlugins.length > 0) {
    const pluginNames = missingPlugins
      .map(p => `${p.title} (${p.slug})`)
      .join(', ');
    const configProposal = missingPlugins
      .map(
        p => `{
      "plugin": "@code-pushup/nx-plugin",
      "options": {
        "targetName": "${TARGET_NAME}-${p.slug}"
      }
    }`,
      )
      .join(',\n    ');
    issues.push(
      `  ✗ Missing targets for plugins: ${pluginNames} → Add these plugin registrations to nx.json "plugins" array:\n    ${configProposal}`,
    );
  }

  // Check 2: project.json should not have empty code-pushup targets (they should be inherited from targetDefaults)
  const projectJsonCpTargets = projectJsonTargetNames.filter(
    t => t.startsWith(TARGET_NAME) && !t.includes('--'),
  );

  const emptyTargets = projectJsonCpTargets.filter(t => {
    const target = projectJsonTargets[t];
    return Object.keys(target || {}).length === 0;
  });

  if (emptyTargets.length > 0) {
    issues.push(
      `  ✗ project.json has empty code-pushup targets: ${emptyTargets.join(', ')} → Remove these empty target definitions (inherit from targetDefaults)`,
    );
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

async function getNxJsonPlugins() {
  try {
    const nxJsonPath = path.join(process.cwd(), 'nx.json');
    const content = await fs.readFile(nxJsonPath, 'utf-8');
    const nxJson = JSON.parse(content);
    return (nxJson.plugins || [])
      .filter(p => p.plugin === '@code-pushup/nx-plugin')
      .map(p => p.options.targetName);
  } catch (error) {
    console.error(`Failed to read nx.json: ${error.message}`);
    process.exit(1);
  }
}

function validateNxJsonPlugins(allConfigPlugins, nxJsonTargets) {
  return Array.from(allConfigPlugins).filter(
    target => !nxJsonTargets.includes(target),
  );
}

async function validateProjectNode(projectName, projectNode) {
  const config = await getProjectConfig(projectNode.data.root);
  const cpTargets = Object.keys(projectNode.data.targets || {}).filter(
    t => t.startsWith(TARGET_NAME) && !t.includes('--'),
  );

  if (!config) {
    if (cpTargets.length > 0) {
      return {
        valid: false,
        output: `✗ ${projectName} no-config:✓ no-targets:✗(${cpTargets.length})`,
        issues: [
          `  ✗ No code-pushup config found but has targets: ${cpTargets.join(', ')}`,
        ],
      };
    }
    return {
      valid: true,
      output: `✓ ${projectName} no-config:✓ no-targets:✓`,
      issues: [],
    };
  }

  const pluginCount = (config.plugins || []).length;
  const configCount = pluginCount + 1;
  const { valid, issues } = validateProject(
    projectName,
    projectNode,
    config,
    projectNode.data.root,
  );

  const expectedTargetCount = pluginCount + 1;
  const countMatch = cpTargets.length === expectedTargetCount;
  const projectJsonTargets = await getProjectJsonTargets(projectNode.data.root);
  const projectJsonCpTargets = Object.keys(projectJsonTargets).filter(
    t => t.startsWith(TARGET_NAME) && !t.includes('--'),
  );
  const emptyTargets = projectJsonCpTargets.filter(
    t => Object.keys(projectJsonTargets[t] || {}).length === 0,
  );
  const projectJsonStatus = emptyTargets.length === 0 ? '✓' : '✗';

  const errorMessages = [];
  if (issues.length > 0) {
    errorMessages.push(...issues);
  }

  if (!countMatch) {
    const extraTargets = cpTargets.length > expectedTargetCount;
    const pluginSlugs = (config.plugins || []).map(p => p.slug);
    const extraTargetNames = cpTargets.filter(t => {
      if (t === TARGET_NAME) return false;
      const slug = t.replace('code-pushup-', '');
      return !pluginSlugs.includes(slug);
    });

    let detailMsg = `config has ${pluginCount} plugins but found ${cpTargets.length} targets (expected ${expectedTargetCount}: 1 main + ${pluginCount} plugins)`;
    if (extraTargetNames.length > 0) {
      detailMsg += ` (extra: ${extraTargetNames.join(', ')})`;
    }

    let fixMsg;
    if (extraTargets) {
      const extraPlugins = extraTargetNames.map(t => `"${t}"`).join(', ');
      fixMsg = `In nx.json, find the plugin registration with targetName: ${extraPlugins} and add "exclude": ["${projectName}"]`;
    } else {
      fixMsg = `Ensure all plugins in code-pushup.config.ts have corresponding targets in nx.json`;
    }
    errorMessages.push(`  ✗ Target count mismatch: ${detailMsg} → ${fixMsg}`);
  }

  const isValid = valid && countMatch && projectJsonStatus === '✓';
  if (isValid) {
    return {
      valid: true,
      output: `✓ ${projectName} config(${configCount}):✓ targets(${cpTargets.length}):✓ projectJson(0):✓`,
      issues: [],
    };
  }

  const configStatus = valid ? '✓' : '✗';
  const targetStatus = countMatch ? '✓' : '✗';
  return {
    valid: false,
    output: `✗ ${projectName} config(${configCount}):${configStatus} targets(${cpTargets.length}):${targetStatus} projectJson(${emptyTargets.length}):${projectJsonStatus}`,
    issues: errorMessages,
  };
}

async function validateAllProjects(nodes, shouldCheckProject) {
  const results = {
    totalValid: 0,
    totalInvalid: 0,
    invalidProjects: [],
    validProjects: [],
    allConfigPlugins: new Set(),
  };

  for (const [projectName, projectNode] of Object.entries(nodes)) {
    if (!shouldCheckProject(projectName)) {
      continue;
    }

    const result = await validateProjectNode(projectName, projectNode);
    log(result.output);

    if (result.valid) {
      results.totalValid++;
      results.validProjects.push(projectName);
    } else {
      results.totalInvalid++;
      results.invalidProjects.push({
        name: projectName,
        issues: result.issues,
      });
    }

    // Collect plugins
    const config = await getProjectConfig(projectNode.data.root);
    if (config) {
      (config.plugins || []).forEach(p => {
        results.allConfigPlugins.add(`${TARGET_NAME}-${p.slug}`);
      });
    }
  }

  return results;
}

function reportResults(results, nxJsonTargets) {
  const missingNxJsonTargets = validateNxJsonPlugins(
    results.allConfigPlugins,
    nxJsonTargets,
  );

  if (missingNxJsonTargets.length > 0) {
    console.log('\n⚠️  Missing plugin registrations in nx.json:');
    missingNxJsonTargets.forEach(target => {
      console.log(
        `  ✗ ${target} is used in code-pushup configs but not registered in nx.json plugins`,
      );
      results.invalidProjects.push({
        name: 'nx.json',
        issues: [
          `  ✗ Plugin target "${target}" is missing from nx.json plugins array → Add plugin registration with targetName: "${target}"`,
        ],
      });
      results.totalInvalid++;
    });
  }

  log('\n' + '='.repeat(60));
  log(`Summary: ${results.totalValid} valid, ${results.totalInvalid} invalid`);
  log('='.repeat(60));

  if (results.invalidProjects.length > 0) {
    log('\n❌ Issues found:\n');
    results.invalidProjects.forEach(({ name, issues }) => {
      log(`${name}:`);
      issues.forEach(issue => log(issue));
      log('');
    });
    process.exit(1);
  } else {
    log('\n✅ All projects have valid Code PushUp target configurations!');
    process.exit(0);
  }
}

/**
 * Main entry point for validating Code PushUp targets against the Nx project graph.
 *
 * Validates that:
 * 1. All plugins in code-pushup configs have corresponding targets in the Nx graph
 * 2. All plugins used in configs are registered in nx.json
 * 3. project.json files don't have empty code-pushup target definitions
 *
 * Supports filtering by project names via command line arguments:
 * @example
 * node validate-cp-targets.mjs                    // Check all projects
 * node validate-cp-targets.mjs models utils       // Check only models and utils
 */
export async function main() {
  log('🔍 Validating Code PushUp targets against project graph...\n');

  const graph = await getProjectGraph();
  const nodes = graph.graph.nodes;
  const nxJsonTargets = await getNxJsonPlugins();

  const projectFilter = process.argv.slice(2);
  const shouldCheckProject =
    projectFilter.length === 0
      ? () => true
      : name => projectFilter.includes(name);

  const results = await validateAllProjects(nodes, shouldCheckProject);
  reportResults(results, nxJsonTargets);
}

main();
