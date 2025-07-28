import { z } from 'zod';
import { filePositionSchema } from './implementation/schemas.js';

const basicTreeNodeValuesSchema = z.record(
  z.string(),
  z.union([z.number(), z.string()]),
);
export type BasicTreeNodeValues = z.infer<typeof basicTreeNodeValuesSchema>;

const basicTreeNodeDataSchema = z.object({
  name: z.string().min(1).describe('Text label for node'),
  values: basicTreeNodeValuesSchema
    .optional()
    .describe('Additional values for node'),
});

export const basicTreeNodeSchema = basicTreeNodeDataSchema.extend({
  get children() {
    return z
      .array(basicTreeNodeSchema)
      .optional()
      .describe('Direct descendants of this node (omit if leaf)');
  },
});
export type BasicTreeNode = z.infer<typeof basicTreeNodeSchema>;

export const coverageTreeMissingLOCSchema = filePositionSchema
  .extend({
    name: z.string().optional().describe('Identifier of function/class/etc.'),
    kind: z.string().optional().describe('E.g. "function", "class"'),
  })
  .describe(
    'Uncovered line of code, optionally referring to a named function/class/etc.',
  );
export type CoverageTreeMissingLOC = z.infer<
  typeof coverageTreeMissingLOCSchema
>;

const coverageTreeNodeValuesSchema = z.object({
  coverage: z.number().min(0).max(1).describe('Coverage ratio'),
  missing: z
    .array(coverageTreeMissingLOCSchema)
    .optional()
    .describe('Uncovered lines of code'),
});
export type CoverageTreeNodeValues = z.infer<
  typeof coverageTreeNodeValuesSchema
>;

const coverageTreeNodeDataSchema = z.object({
  name: z.string().min(1).describe('File or folder name'),
  values: coverageTreeNodeValuesSchema.describe(
    'Coverage metrics for file/folder',
  ),
});

export const coverageTreeNodeSchema = coverageTreeNodeDataSchema.extend({
  get children() {
    return z
      .array(coverageTreeNodeSchema)
      .optional()
      .describe('Files and folders contained in this folder (omit if file)');
  },
});
export type CoverageTreeNode = z.infer<typeof coverageTreeNodeSchema>;

export const basicTreeSchema = z
  .object({
    title: z.string().optional().describe('Heading'),
    type: z.literal('basic').optional().describe('Discriminant'),
    root: basicTreeNodeSchema.describe('Root node'),
  })
  .describe('Generic tree');
export type BasicTree = z.infer<typeof basicTreeSchema>;

export const coverageTreeSchema = z
  .object({
    title: z.string().optional().describe('Heading'),
    type: z.literal('coverage').describe('Discriminant'),
    root: coverageTreeNodeSchema.describe('Root folder'),
  })
  .describe('Coverage for files and folders');
export type CoverageTree = z.infer<typeof coverageTreeSchema>;

export const treeSchema = z.union([basicTreeSchema, coverageTreeSchema]);
export type Tree = z.infer<typeof treeSchema>;
