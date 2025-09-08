import type { JSONSchema7 } from 'json-schema';

export type DefaultSource =
  | 'argv'
  | 'projectName'
  | 'project'
  | 'target'
  | 'configuration'
  | 'cwd';

export type NxPrompt =
  | string
  | {
      message?: string;
      type?: 'input' | 'confirm' | 'list' | 'multiselect';
      items?: Array<{ value: unknown; label?: string } | string>;
      multiselect?: boolean;
    };

export type NxExtensions = {
  /** Nx/DevKit prompt metadata */
  'x-prompt'?: NxPrompt;
  /** Angular DevKit-style default source */
  $default?: { $source: DefaultSource; index?: number };
  /** Optional extras sometimes used in schemas */
  'x-deprecated'?: boolean | string;
};

export type NxJSONSchema = Omit<
  JSONSchema7,
  'properties' | 'items' | 'oneOf' | 'anyOf' | 'allOf'
> &
  NxExtensions & {
    properties?: Record<string, NxJSONSchema>;
    items?: NxJSONSchema | NxJSONSchema[];
    oneOf?: NxJSONSchema[];
    anyOf?: NxJSONSchema[];
    allOf?: NxJSONSchema[];
  };

export interface NxSchemaOptions {
  /**
   * The name of the schema (used for $id and title generation)
   */
  name: string;
  /**
   * The title of the schema (optional, defaults to name)
   */
  title?: string;
  /**
   * Description of the schema
   */
  description?: string;
  /**
   * Whether to add Nx's $default for argv command parameter
   * @default true
   */
  includeCommandDefault?: boolean;
  /**
   * Whether to allow additional properties
   * @default true
   */
  additionalProperties?: boolean;
}

export interface NxExecutorSchema extends NxJSONSchema {
  $schema: string;
  $id: string;
  title: string;
  description?: string;
  type: 'object';
  properties: Record<string, NxJSONSchema>;
  additionalProperties: boolean;
}
