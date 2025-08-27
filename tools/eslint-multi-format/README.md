# ESLint Multi-Format Formatter

The ESLint plugin uses a custom formatter that supports multiple output formats and destinations simultaneously.

## Configuration

Use the `ESLINT_FORMATTER_CONFIG` environment variable to configure the formatter with JSON.

### Configuration Schema

```json
{
  "outputDir": "./reports", // Optional: Output directory (default: cwd/.eslint)
  "filename": "eslint-report", // Optional: Base filename without extension (default: 'eslint-report')
  "formats": ["json"], // Optional: Array of format names for file output (default: ['json'])
  "terminal": "stylish", // Optional: Format for terminal output (default: 'stylish')
  "verbose": true // Optional: Enable verbose logging (default: false)
}
```

### Supported Formats

The following ESLint formatters are supported:

- `stylish` (default terminal output)
- `json` (default file output)
- Custom formatters (fallback to stylish formatting)

## Usage Examples

### Basic Usage

```bash
# Default behavior - JSON file output + stylish console output
npx eslint .

# Custom output directory and filename
ESLINT_FORMATTER_CONFIG='{"outputDir":"./ci-reports","filename":"lint-results"}' npx eslint .
# Creates: ci-reports/lint-results.json + terminal output
```

### Multiple Output Formats

```bash
# Generate JSON file
ESLINT_FORMATTER_CONFIG='{"formats":["json"],"terminal":"stylish"}' npx eslint .
# Creates: .eslint/eslint-report.json + terminal output

# Custom directory with JSON format
ESLINT_FORMATTER_CONFIG='{"outputDir":"./reports","filename":"eslint-results","formats":["json"]}' npx eslint .
# Creates: reports/eslint-results.json
```

### Terminal Output Only

```bash
# Only show terminal output, no files
ESLINT_FORMATTER_CONFIG='{"formats":[],"terminal":"stylish"}' npx eslint .

# Different terminal format
ESLINT_FORMATTER_CONFIG='{"formats":[],"terminal":"stylish"}' npx eslint .
```

### Configuration from File

```bash
# Create a configuration file
cat > eslint-config.json << 'EOF'
{
  "outputDir": "./ci-reports",
  "filename": "eslint-report",
  "formats": ["json", "stylish"],
  "terminal": "stylish",
  "verbose": true
}
EOF

# Use the configuration file
ESLINT_FORMATTER_CONFIG="$(cat eslint-config.json)" npx eslint .
```

## Default Behavior

When no `ESLINT_FORMATTER_CONFIG` is provided, the formatter uses these defaults:

- **outputDir**: `./.eslint` (relative to current working directory)
- **filename**: `eslint-report`
- **formats**: `["json"]`
- **terminal**: `stylish`
- **verbose**: `false`

This means by default you get:

- A JSON file at `./.eslint/eslint-report.json`
- Stylish terminal output
