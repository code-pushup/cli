# Codecov Matrix Generator

This tool generates a GitHub Actions matrix configuration for running code coverage across all packages in the monorepo.

## Overview

The script analyzes the Nx project graph to identify all packages and their available test targets, then outputs a JSON matrix that GitHub Actions can use to run coverage tests in parallel.

## How It Works

1. Queries the Nx project graph to find all projects in `packages/`
2. Identifies available test targets: `unit-test` and `int-test`
3. Excludes combinations where a project doesn't have a specific test target
4. Outputs a JSON matrix with `project`, `target`, and `exclude` fields

## Usage

### In GitHub Actions Workflow

The tool is used in `.github/workflows/code-coverage.yml`:

```yaml
- name: List packages using Nx CLI
  id: list-packages
  run: |
    matrix=$(node tools/scripts/create-codecov-matrix.js)
    echo "matrix=$matrix" >> $GITHUB_OUTPUT
```

The generated matrix is then consumed by the coverage job:

```yaml
coverage:
  needs: [list-packages]
  strategy:
    matrix: ${{ fromJson(needs.list-packages.outputs.matrix) }}
  steps:
    - run: npx nx run ${{ matrix.project }}:${{ matrix.target }}
    - uses: codecov/codecov-action@v4
      with:
        directory: coverage/${{ matrix.project }}/${{ matrix.target }}s/
        flags: ${{ matrix.project }}-${{ matrix.target }}
```

### Local Usage

Run the script directly to see the generated matrix:

```bash
node tools/codecov/src/bin.js
```

Or via the alternative script location:

```bash
node tools/scripts/create-codecov-matrix.js
```

## Output Format

The script outputs a JSON object with the following structure:

```json
{
  "project": ["cli", "core", "models", "nx-plugin", "utils"],
  "target": ["unit-test", "int-test"],
  "exclude": [{ "project": "models", "target": "int-test" }]
}
```

- `project`: Array of all package names found in `packages/`
- `target`: Array of test targets to run
- `exclude`: Array of project/target combinations to skip (when a project doesn't have that target defined)
