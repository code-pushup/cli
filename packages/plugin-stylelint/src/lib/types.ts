import { EMPTY_GROUPS } from './constants.js';

type EmptyGroups = typeof EMPTY_GROUPS;
export type GroupSlug = EmptyGroups[number]['slug'];
