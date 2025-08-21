export type EslintFormat =
  | 'stylish'
  | 'json'
  | 'json-with-metadata'
  | 'html'
  | 'xml'
  | 'checkstyle'
  | 'junit'
  | 'tap'
  | 'unix'
  | 'compact'
  | 'codeframe'
  | 'table'
  | string;

export type FormatterConfig = {
  outputDir?: string;
  filename?: string;
  formats?: EslintFormat[];
  terminal?: EslintFormat;
  verbose?: boolean;
};

export type EnvironmentConfig = {
  formatterConfig?: string;
};

export type ResolvedConfig = {
  config: FormatterConfig;
  source: string;
  usingDefaults: boolean;
};

export type ProcessFileOutputsResult = {
  success: boolean;
  jsonResult: string;
};
