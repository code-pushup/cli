export type UndocumentedItem = {
  file: string;
  type: string;
  name: string;
  line: number;
  class?: string;
};

export type CoverageByType = {
  functions: number;
  variables: number;
  classes: number;
  methods: number;
  properties: number;
  interfaces: number;
  types: number;
};

export type CoverageKey = keyof CoverageByType;

export type DocumentationStats = {
  documented: number;
  total: number;
};

export type CoverageResult = {
  undocumentedItems: UndocumentedItem[];
  currentCoverage: number;
  coverageByType: CoverageByType;
};
