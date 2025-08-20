// Minimal ESLint multiple formatter for Nx
const { writeFileSync } = require('fs');
const { dirname, resolve } = require('path');
const { sync: mkdirp } = require('mkdirp');
const { ESLint } = require('eslint');

const eslint = new ESLint();

module.exports = async function (results, context) {
  // Default configuration
  let config = {
    formatters: [
      {
        name: 'stylish',
        output: 'console',
      },
    ],
    globalOptions: {
      verbose: false,
      timestamp: false,
      showProgress: false,
    },
  };

  // Parse ESLINT_EXTRA_FORMATS - support both JSON and comma-separated formats
  if (process.env.ESLINT_EXTRA_FORMATS) {
    const extraFormatsValue = process.env.ESLINT_EXTRA_FORMATS.trim();

    try {
      // Try to parse as JSON first
      const jsonConfig = JSON.parse(extraFormatsValue);

      // Merge with default config
      if (jsonConfig.formatters) {
        // Replace default formatters with JSON config formatters
        config.formatters = [...jsonConfig.formatters];
      }

      if (jsonConfig.globalOptions) {
        config.globalOptions = {
          ...config.globalOptions,
          ...jsonConfig.globalOptions,
        };
      }

      // Handle additional JSON properties
      if (jsonConfig.verbose !== undefined)
        config.globalOptions.verbose = jsonConfig.verbose;
      if (jsonConfig.timestamp !== undefined)
        config.globalOptions.timestamp = jsonConfig.timestamp;
      if (jsonConfig.showProgress !== undefined)
        config.globalOptions.showProgress = jsonConfig.showProgress;
    } catch (error) {
      // Fallback to comma-separated format for backwards compatibility
      const extraFormats = extraFormatsValue.split(',');
      for (const format of extraFormats) {
        const trimmedFormat = format.trim();
        if (
          trimmedFormat &&
          !config.formatters.some(f => f.name === trimmedFormat)
        ) {
          config.formatters.push({
            name: trimmedFormat,
            output: 'console',
          });
        }
      }
    }
  }

  // Always ensure JSON formatter for Nx (unless already configured)
  if (!config.formatters.some(f => f.name === 'json')) {
    config.formatters.push({
      name: 'json',
      output: 'file',
      path: 'eslint-report.json',
    });
  }

  // Apply global options
  if (config.globalOptions.timestamp) {
    console.log(`ESLint run at: ${new Date().toISOString()}`);
  }

  let jsonResult = '';

  for (const formatterConfig of config.formatters) {
    if (config.globalOptions.verbose) {
      console.log(`Using formatter: ${formatterConfig.name}`);
    }

    const formatter = await eslint.loadFormatter(formatterConfig.name);
    let formatterResult = formatter.format(results);

    // Apply formatter-specific options
    if (
      formatterConfig.options &&
      formatterConfig.name === 'json' &&
      formatterConfig.options.pretty
    ) {
      try {
        const parsed = JSON.parse(formatterResult);
        formatterResult = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Keep original if parsing fails
      }
    }

    if (formatterConfig.output === 'console') {
      console.log(formatterResult);
    } else if (formatterConfig.output === 'file') {
      const filePath = resolve(process.cwd(), formatterConfig.path);
      try {
        mkdirp(dirname(filePath));
        writeFileSync(filePath, formatterResult);

        if (config.globalOptions.verbose) {
          console.log(`Written ${formatterConfig.name} output to: ${filePath}`);
        }
      } catch (ex) {
        console.error('Error writing output file:', ex.message);
        return false;
      }
    }

    // Store JSON result for Nx output file handling
    if (formatterConfig.name === 'json') {
      jsonResult = formatterResult;
    }
  }

  // Return JSON result for Nx to write to outputFile
  return jsonResult || JSON.stringify(results);
};
