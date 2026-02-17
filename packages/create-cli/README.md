# @code-pushup/create-cli

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Fcreate-cli.svg)](https://www.npmjs.com/package/@code-pushup/create-cli)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Fcreate-cli)](https://npmtrends.com/@code-pushup/create-cli)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/create-cli)](https://www.npmjs.com/package/@code-pushup/create-cli?activeTab=dependencies)

An interactive setup wizard that scaffolds a `code-pushup.config.ts` file in your repository.

## Usage

```bash
npx @code-pushup/create-cli
```

The wizard will prompt you to select plugins and configure their options, then generate a `code-pushup.config.ts` file.

## Options

| Flag          | Description                            | Default |
| ------------- | -------------------------------------- | ------- |
| `--plugins`   | Comma-separated plugin slugs to enable |         |
| `--dry-run`   | Preview changes without writing files  | `false` |
| `--yes`, `-y` | Skip prompts and use defaults          | `false` |

### Examples

Run interactively (default):

```bash
npx @code-pushup/create-cli
```

Skip prompts and enable specific plugins:

```bash
npx @code-pushup/create-cli -y --plugins=eslint,coverage
```

Preview the generated config without writing:

```bash
npx @code-pushup/create-cli -y --dry-run
```
