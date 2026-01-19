import parseLcovExport from 'parse-lcov';

type ParseLcovFn = (content: string) => any[];

export const parseLcov: ParseLcovFn = (parseLcovExport as any).default;
