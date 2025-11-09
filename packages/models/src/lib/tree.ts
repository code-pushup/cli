import { z } from 'zod';
import { filePositionSchema } from './implementation/schemas.js';

const basicTreeNodeValuesSchema = z.record(
  z.string(),
  z.union([z.number(), z.string()]),
);
const basicTreeNodeDataSchema = z.object({
  name: z.string().min(1).meta({ description: 'Text label for node' }),
  values: basicTreeNodeValuesSchema
    .optional()
    .meta({ description: 'Additional values for node' }),
});

export const basicTreeNodeSchema: z.ZodType<BasicTreeNode> =
  basicTreeNodeDataSchema
    .extend({
      get children() {
        return z.array(basicTreeNodeSchema).optional().meta({
          description: 'Direct descendants of this node (omit if leaf)',
        });
      },
    })
    .meta({ title: 'BasicTreeNode' });

export type BasicTreeNode = z.infer<typeof basicTreeNodeDataSchema> & {
  children?: BasicTreeNode[];
};

export const coverageTreeMissingLOCSchema = filePositionSchema
  .extend({
    name: z
      .string()
      .optional()
      .meta({ description: 'Identifier of function/class/etc.' }),
    kind: z
      .string()
      .optional()
      .meta({ description: 'E.g. "function", "class"' }),
  })
  .meta({
    title: 'CoverageTreeMissingLOC',
    description:
      'Uncovered line of code, optionally referring to a named function/class/etc.',
  });
export type CoverageTreeMissingLOC = z.infer<
  typeof coverageTreeMissingLOCSchema
>;

const coverageTreeNodeValuesSchema = z.object({
  coverage: z.number().min(0).max(1).meta({ description: 'Coverage ratio' }),
  missing: z
    .array(coverageTreeMissingLOCSchema)
    .optional()
    .meta({ description: 'Uncovered lines of code' }),
});
const coverageTreeNodeDataSchema = z.object({
  name: z.string().min(1).meta({ description: 'File or folder name' }),
  values: coverageTreeNodeValuesSchema.meta({
    description: 'Coverage metrics for file/folder',
  }),
});

export const coverageTreeNodeSchema: z.ZodType<CoverageTreeNode> =
  coverageTreeNodeDataSchema
    .extend({
      get children() {
        return z.array(coverageTreeNodeSchema).optional().meta({
          description:
            'Files and folders contained in this folder (omit if file)',
        });
      },
    })
    .meta({ title: 'CoverageTreeNode' });

export type CoverageTreeNode = z.infer<typeof coverageTreeNodeDataSchema> & {
  children?: CoverageTreeNode[];
};

export const basicTreeSchema = z
  .object({
    title: z.string().optional().meta({ description: 'Heading' }),
    type: z.literal('basic').optional().meta({ description: 'Discriminant' }),
    root: basicTreeNodeSchema.meta({ description: 'Root node' }),
  })
  .meta({
    title: 'BasicTree',
    description: 'Generic tree',
  });
export type BasicTree = z.infer<typeof basicTreeSchema>;

export const coverageTreeSchema = z
  .object({
    title: z.string().optional().meta({ description: 'Heading' }),
    type: z.literal('coverage').meta({ description: 'Discriminant' }),
    root: coverageTreeNodeSchema.meta({ description: 'Root folder' }),
  })
  .meta({
    title: 'CoverageTree',
    description: 'Coverage for files and folders',
  });
export type CoverageTree = z.infer<typeof coverageTreeSchema>;

export const treeSchema = z
  .union([basicTreeSchema, coverageTreeSchema])
  .meta({ title: 'Tree' });
export type Tree = z.infer<typeof treeSchema>;
