import { z } from 'zod';
import { MAX_ISSUE_MESSAGE_LENGTH } from './implementation/limits.js';
import {
  issueSourceSchema,
  sourceFileLocationSchema,
  sourceUrlLocationSchema,
} from './source.js';

export const issueSeveritySchema = z.enum(['info', 'warning', 'error']).meta({
  title: 'IssueSeverity',
  description: 'Severity level',
});
export type IssueSeverity = z.infer<typeof issueSeveritySchema>;

export const issueSchema = z
  .object({
    message: z
      .string()
      .max(MAX_ISSUE_MESSAGE_LENGTH)
      .meta({ description: 'Descriptive error message' }),
    severity: issueSeveritySchema,
    source: issueSourceSchema.optional(),
  })
  .meta({
    title: 'Issue',
    description: 'Issue information',
  });
export type Issue = z.infer<typeof issueSchema>;

export const fileIssueSchema = issueSchema
  .extend({ source: sourceFileLocationSchema })
  .meta({
    title: 'FileIssue',
    description: 'Issue with a file source location',
  });
export type FileIssue = z.infer<typeof fileIssueSchema>;

export const urlIssueSchema = issueSchema
  .extend({ source: sourceUrlLocationSchema })
  .meta({
    title: 'UrlIssue',
    description: 'Issue with a URL source location',
  });
export type UrlIssue = z.infer<typeof urlIssueSchema>;
