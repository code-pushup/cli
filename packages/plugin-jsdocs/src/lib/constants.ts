import type { Audit, Group } from '@code-pushup/models';
import type { AuditSlug } from './models.js';

export const PLUGIN_SLUG = 'jsdocs';

export const AUDITS_MAP: Record<AuditSlug, Audit> = {
  'classes-coverage': {
    slug: 'classes-coverage',
    title: 'Classes coverage',
    description: 'Documentation coverage of classes',
  },
  'methods-coverage': {
    slug: 'methods-coverage',
    title: 'Methods coverage',
    description: 'Documentation coverage of methods',
  },
  'functions-coverage': {
    slug: 'functions-coverage',
    title: 'Functions coverage',
    description: 'Documentation coverage of functions',
  },
  'interfaces-coverage': {
    slug: 'interfaces-coverage',
    title: 'Interfaces coverage',
    description: 'Documentation coverage of interfaces',
  },
  'variables-coverage': {
    slug: 'variables-coverage',
    title: 'Variables coverage',
    description: 'Documentation coverage of variables',
  },
  'properties-coverage': {
    slug: 'properties-coverage',
    title: 'Properties coverage',
    description: 'Documentation coverage of properties',
  },
  'types-coverage': {
    slug: 'types-coverage',
    title: 'Types coverage',
    description: 'Documentation coverage of types',
  },
  'enums-coverage': {
    slug: 'enums-coverage',
    title: 'Enums coverage',
    description: 'Documentation coverage of enums',
  },
} as const;

export const groups: Group[] = [
  {
    slug: 'documentation-coverage',
    title: 'Documentation coverage',
    description: 'Documentation coverage',
    refs: Object.keys(AUDITS_MAP).map(slug => ({
      slug,
      weight: [
        'classes-coverage',
        'functions-coverage',
        'methods-coverage',
      ].includes(slug)
        ? 2
        : 1,
    })),
  },
];
