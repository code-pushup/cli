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
  type YarnClassicFieldName,
  type YarnClassicOutdatedResultJson,
  yarnClassicFieldNames,
} from './types.js';

export function yarnClassicToOutdatedResult(output: string): OutdatedResult {
  const yarnOutdated = fromJsonLines<YarnClassicOutdatedResultJson>(output);
  const fields = yarnOutdated[1]?.data.head ?? [];
  const dependencies = yarnOutdated[1]?.data.body ?? [];

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
  const relevantFields = head.filter(isYarnClassicFieldName);
  if (hasAllRequiredFields(relevantFields)) {
    return true;
  }

  throw new Error(
    `Yarn v1 outdated: Template [${head.join(
      ', ',
    )}] does not contain all required fields [${yarnClassicFieldNames.join(', ')}]`,
  );
}

function isYarnClassicFieldName(value: string): value is YarnClassicFieldName {
  const names: readonly string[] = yarnClassicFieldNames;
  return names.includes(value);
}

function hasAllRequiredFields(head: YarnClassicFieldName[]) {
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
