export type EslintFormat = 'stylish' | 'json' | string;

export type FormatterConfig = {
  outputDir?: string;
  filename?: string;
  formats?: EslintFormat[];
  terminal?: EslintFormat;
  verbose?: boolean;
};
