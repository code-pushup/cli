# ESLint Formatter Configuration Examples

## JSON Configuration Format

The `ESLINT_EXTRA_FORMATS` environment variable now supports JSON configuration for advanced formatting options.

### Basic JSON Configuration

```json
{
  "formatters": [
    {
      "name": "stylish",
      "output": "console"
    },
    {
      "name": "json",
      "output": "file",
      "path": "custom-eslint-report.json",
      "options": {
        "pretty": true
      }
    }
  ],
  "globalOptions": {
    "verbose": true,
    "timestamp": true,
    "showProgress": false
  }
}
```

### Advanced Configuration

```json
{
  "formatters": [
    {
      "name": "stylish",
      "output": "console"
    },
    {
      "name": "json",
      "output": "file",
      "path": "reports/eslint-detailed.json",
      "options": {
        "pretty": true
      }
    },
    {
      "name": "json",
      "output": "file",
      "path": "reports/eslint-compact.json",
      "options": {
        "pretty": false
      }
    }
  ],
  "globalOptions": {
    "verbose": true,
    "timestamp": true
  }
}
```

## Usage Examples

### Using JSON Configuration

```bash
# One-liner (escape quotes properly)
ESLINT_EXTRA_FORMATS='{"formatters":[{"name":"stylish","output":"console"},{"name":"json","output":"file","path":"custom-report.json","options":{"pretty":true}}],"globalOptions":{"verbose":true,"timestamp":true}}' npx nx run utils:lint

# From file
ESLINT_EXTRA_FORMATS="$(cat eslint-config.json)" npx nx run utils:lint
```

### Backwards Compatibility (Comma-separated)

```bash
# Still works for simple cases
ESLINT_EXTRA_FORMATS="stylish" npx nx run utils:lint
```

## Configuration Schema

### Formatter Object

- `name` (string): ESLint formatter name (e.g., "stylish", "json", "checkstyle")
- `output` (string): "console" or "file"
- `path` (string, optional): File path for "file" output
- `options` (object, optional): Formatter-specific options
  - `pretty` (boolean): Pretty-print JSON output

### Global Options

- `verbose` (boolean): Show detailed logging
- `timestamp` (boolean): Show execution timestamp
- `showProgress` (boolean): Show progress information

## Default Behavior

Without `ESLINT_EXTRA_FORMATS`, the formatter will:

1. Output stylish format to console
2. Generate JSON file for Nx at `eslint-report.json`
3. Return JSON data to Nx for the configured `outputFile`
