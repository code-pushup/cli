import type {
  AuditReport,
  CategoryConfig,
  Group,
  PersistConfig,
  PluginReport,
  Report,
} from '@code-pushup/models';

export type ScoredCategoryConfig = CategoryConfig & { score: number };

export type ScoredGroup = Group & {
  score: number;
};

export type ScoredReport = Omit<Report, 'plugins' | 'categories'> & {
  plugins: (Omit<PluginReport, 'groups'> & {
    groups?: ScoredGroup[];
  })[];
  categories: ScoredCategoryConfig[];
};

export type SortableGroup = ScoredGroup & {
  weight: number;
  plugin: string;
};

export type SortableAuditReport = AuditReport & {
  weight: number;
  plugin: string;
};

export type DiffOutcome = 'positive' | 'negative' | 'mixed' | 'unchanged';

export type MdReportOptions = Pick<PersistConfig, 'outputDir'>;

export const SUPPORTED_ENVIRONMENTS = [
  'vscode',
  'github',
  'gitlab',
  'other',
] as const;
export type EnvironmentType = (typeof SUPPORTED_ENVIRONMENTS)[number];
