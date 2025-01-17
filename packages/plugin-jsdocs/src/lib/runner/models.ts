/** The possible coverage types for documentation analysis */
export type CoverageType =
  | 'classes'
  | 'methods'
  | 'functions'
  | 'interfaces'
  | 'enums'
  | 'variables'
  | 'properties'
  | 'types';

/** The undocumented node is the node that is not documented and has the information for the report. */
export type UndocumentedNode = {
  file: string;
  type: CoverageType;
  name: string;
  line: number;
  class?: string;
};

/** The documentation data has the issues and the total nodes count from a specific CoverageType. */
export type DocumentationData = {
  issues: UndocumentedNode[];
  nodesCount: number;
};

/** The documentation report has all the documentation data for each coverage type. */
export type DocumentationReport = Record<CoverageType, DocumentationData>;

/** The processed documentation result has the documentation data for each coverage type and with coverage stats. */
export type DocumentationCoverageReport = Record<
  CoverageType,
  DocumentationData & {
    coverage: number;
  }
>;
