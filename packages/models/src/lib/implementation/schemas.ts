import { z } from 'zod';
import {
  generalFilePathRegex,
  refRegex,
  slugRegex,
  unixFilePathRegex,
} from './utils';

/**
 * Schema for a slug of a categories, plugins or audits.
 * @param description
 */
export function slugSchema(description: string) {
  return z
    .string({ description })
    .regex(slugRegex) // also validates ``and ` `
    .max(128);
}

/**
 * Schema for a reference to a plugin's audit (e.g. 'eslint#max-lines') or category (e.g. 'categories:lhci#performance') or audit in RunnerOutput (e.g. 'eslint#max-lines')
 */
export function refSchema(description: string) {
  return z.string({ description }).regex(refRegex).max(256);
}

/**
 * Schema for a general description property
 * @param description
 */
export function descriptionSchema(description: string) {
  return z.string({ description }).max(65536).optional();
}

/**
 * Schema for a docsUrl
 * @param description
 */
export function docsUrlSchema(description: string) {
  return z.string({ description }).url().optional();
}

/**
 * Schema for a title of a plugin, category and audit
 * @param description
 */
export function titleSchema(description: string) {
  return z.string({ description }).max(128);
}

/**
 * Schema for a generalFilePath
 * @param description
 */
export function generalFilePathSchema(description: string) {
  return z.string({ description }).regex(generalFilePathRegex);
}

/**
 * Schema for a unixFilePath
 * @param description
 */
export function unixFilePathSchema(description: string) {
  return z.string({ description }).regex(unixFilePathRegex);
}
