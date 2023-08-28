export type TsupExecutorSchema = {
  project: string;
  main: string;
  outputPath: string;
  deleteOutputPath: boolean;
  tsConfig: string;
  format: ('esm' | 'cjs')[];
};
