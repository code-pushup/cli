import { z } from 'zod';
import {
  generalFilePathRegex,
  refOrGroupRegex,
  refRegex,
  slugRegex,
  unixFilePathRegex,
} from './utils';

/**
 * Schema for a slug of a categories, plugins or audits.
 * @param description
 */
export function slugSchema(description: string) {
  return (
    z
      .string({ description })
      // also validates ``and ` `
      .regex(slugRegex, {
        message:
          'The slug has to follow the patters [0-9a-z] followed by multiple optional groups of -[0-9a-z]. e.g. my-slug',
      })
      .max(128, {
        message: 'slug can be may 128 character',
      })
  );
}

/**
 * Schema for a reference to a plugin's
 * - audit in categories (e.g. 'eslint#max-lines')
 * - or audit in RunnerOutput (e.g. 'eslint#max-lines')
 */
export function refSchema(description: string) {
  return (
    z
      .string({ description })
      // also validates ``and ` `
      .regex(refRegex, {
        message: 'The ref has to follow the patters {plugin-slug}#{audit-slug}',
      })
      .max(256)
  );
}

/**
 * Schema for a reference to a plugin's
 * - audit in categories (e.g. 'eslint#max-lines')
 * - or group (e.g. 'groups:lhci#performance')
 * - or audit in RunnerOutput (e.g. 'eslint#max-lines')
 */
export function auditOrGroupRefSchema(description: string) {
  return (
    z
      .string({ description })
      // also validates ``and ` `
      .regex(refOrGroupRegex, {
        message:
          'The ref has to follow the patters {plugin-slug}#{audit-slug} or {plugin-slug}#group:{audit-slug}',
      })
      .max(256)
  );
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
  return urlSchema(description).optional();
}

/**
 * Schema for a URL
 * @param description
 */
export function urlSchema(description: string) {
  return z.string({ description }).url();
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
  return z.string({ description }).regex(generalFilePathRegex, {
    message: 'path is invalid',
  });
}

/**
 * Schema for a unixFilePath
 * @param description
 */
export function weightSchema(description: string) {
  return positiveIntSchema(description);
}

/**
 * Schema for a positiveInt
 * @param description
 */
export function positiveIntSchema(description: string) {
  return z.number({ description }).int().nonnegative();
}
/**
 * Schema for a unixFilePath
 * @param description
 */
export function unixFilePathSchema(description: string) {
  return z.string({ description }).regex(unixFilePathRegex);
}
