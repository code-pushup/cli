# NPM Nx Plugin

## Usage

Configure a target in your project json.

```jsonc
// nx.json
{
  "name": "my-project",
  "plugins": ["tools/npm/npm.plugin.ts"]
}
```

With options:

```jsonc
// nx.json
{
  "name": "my-project",
  "plugins": [
    {
      "plugin": "tools/npm/npm.plugin.ts",
      "options": {
        "tsconfig": "tools/tsconfig.tools.json",
        "npmCheckScript": "check-package-range.ts"
      }
    }
  ]
}
```

Run dynamically added targets:

- `nx run <project-name>:npm-check --pkgVersion=1.0.0 --registry=https://registry.npmjs.org`
- `nx run <project-name>:npm-install --pkgVersion=1.0.0 --registry=https://registry.npmjs.org`
- `nx run <project-name>:npm-uninstall`
