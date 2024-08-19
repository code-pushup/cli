import { Diff } from '@code-pushup/utils';

export type CompareOptions = Diff<string> & { label?: string };
