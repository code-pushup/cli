import parseLcovExport from 'parse-lcov';

type ParseLcovFn = typeof parseLcovExport;

// the parse-lcov export is inconsistent (sometimes it's .default, sometimes it's .default.default)
const godKnows = parseLcovExport as unknown as
  | ParseLcovFn
  | { default: ParseLcovFn };

export const parseLcov: ParseLcovFn =
  'default' in godKnows ? godKnows.default : godKnows;
