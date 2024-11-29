import {
  fromJsonLines,
  objectFromEntries,
  objectToEntries,
  objectToKeys,
} from '@code-pushup/utils';
import type {
  OutdatedDependency,
  OutdatedResult,
} from '../../runner/outdated/types.js';
import {
  REQUIRED_OUTDATED_FIELDS,
  outdatedtoFieldMapper,
} from './constants.js';
import {
  type Yarnv1FieldName,
  type Yarnv1OutdatedResultJson,
  yarnv1FieldNames,
} from './types.js';

export function yarnv1ToOutdatedResult(output: string): OutdatedResult {
  const yarnv1Outdated = fromJsonLines<Yarnv1OutdatedResultJson>(output);
  const fields = yarnv1Outdated[1].data.head;
  const dependencies = yarnv1Outdated[1].data.body;

  // no outdated dependencies
  if (dependencies.length === 0) {
    return [];
  }

  // map dynamic fields
  validateOutdatedFields(fields);
  const indexMapping = getOutdatedFieldIndexes(fields);

  return dependencies.map(
    dep =>
      objectFromEntries(
        objectToKeys(indexMapping)
          .map(field => [field, dep[indexMapping[field]]] as const)
          .filter(
            (entry): entry is [keyof OutdatedDependency, string] =>
              entry[1] != null,
          ),
      ) as OutdatedDependency,
  );
}

export function validateOutdatedFields(head: string[]) {
  const relevantFields = head.filter(isYarnv1FieldName);
  if (hasAllRequiredFields(relevantFields)) {
    return true;
  }

  throw new Error(
    `Yarn v1 outdated: Template [${head.join(
      ', ',
    )}] does not contain all required fields [${yarnv1FieldNames.join(', ')}]`,
  );
}

function isYarnv1FieldName(value: string): value is Yarnv1FieldName {
  const names: readonly string[] = yarnv1FieldNames;
  return names.includes(value);
}

function hasAllRequiredFields(head: Yarnv1FieldName[]) {
  return REQUIRED_OUTDATED_FIELDS.every(field => head.includes(field));
}

export function getOutdatedFieldIndexes(all: string[]) {
  return objectFromEntries(
    objectToEntries(outdatedtoFieldMapper).map(([outdatedField, yarnField]) => [
      outdatedField,
      all.indexOf(yarnField),
    ]),
  );
}
