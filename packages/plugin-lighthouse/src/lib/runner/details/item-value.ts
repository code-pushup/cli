import ansis from 'ansis';
import type { IcuMessage } from 'lighthouse';
// @ts-ignore - lighthouse types not properly exported in v12
import type Details from 'lighthouse/types/lhr/audit-details';
import {
  formatBytes,
  formatDuration,
  html,
  logger,
  roundDecimals,
  truncateText,
} from '@code-pushup/utils';

export type PrimitiveItemValue = string | number | boolean;
export type ObjectItemValue = Exclude<
  Details.ItemValue,
  PrimitiveItemValue | IcuMessage
>;
export type SimpleItemValue =
  | Extract<
      ObjectItemValue,
      Details.NumericValue | Details.CodeValue | Details.UrlValue
    >
  | PrimitiveItemValue;

export function trimSlice(item?: PrimitiveItemValue, maxLength = 0) {
  const str = String(item).trim();
  return maxLength > 0 ? str.slice(0, maxLength) : str;
}

export function parseNodeValue(node?: Details.NodeValue): string {
  const { selector = '' } = node ?? {};
  return selector;
}

// eslint-disable-next-line max-lines-per-function
export function formatTableItemPropertyValue(
  itemValue?: Details.ItemValue,
  itemValueFormat?: Details.ItemValueType,
) {
  // null
  if (itemValue == null) {
    return '';
  }

  // Primitive Values
  if (itemValueFormat == null) {
    if (typeof itemValue === 'string') {
      return trimSlice(itemValue);
    }

    if (typeof itemValue === 'number') {
      return Number(itemValue);
    }

    if (typeof itemValue === 'boolean') {
      return itemValue;
    }
  }

  const parsedItemValue = parseTableItemPropertyValue(itemValue);

  /* eslint-disable @typescript-eslint/no-magic-numbers */
  switch (itemValueFormat) {
    case 'bytes':
      return formatBytes(Number(parsedItemValue));
    case 'code':
      return html.code(trimSlice(parsedItemValue as string));
    case 'link':
      const link = parsedItemValue as Details.LinkValue;
      return html.link(link.url, link.text);
    case 'url':
      const url = parsedItemValue as string;
      return html.link(url);
    case 'timespanMs':
    case 'ms':
      return formatDuration(Number(parsedItemValue), 3);
    case 'node':
      return parseNodeValue(itemValue as Details.NodeValue);
    case 'source-location':
      return truncateText(String(parsedItemValue), 200);
    case 'numeric':
      const num = Number(parsedItemValue);
      return roundDecimals(num, 3).toString();
    case 'text':
      return truncateText(String(parsedItemValue), 500);
    case 'multi': // @TODO
      // @TODO log verbose first, then implement data type
      logger.debug(`Format type ${ansis.bold('multi')} is not implemented`);
      return '';
    case 'thumbnail': // @TODO
      // @TODO log verbose first, then implement data type
      logger.debug(`Format type ${ansis.bold('thumbnail')} is not implemented`);
      return '';
  }
  /* eslint-enable @typescript-eslint/no-magic-numbers */

  return itemValue;
}

export function parseSimpleItemValue(
  item: SimpleItemValue,
): PrimitiveItemValue {
  if (typeof item === 'object') {
    const value = item.value;
    if (typeof value === 'object') {
      return value.formattedDefault;
    }
    return value;
  }
  return item;
}

// @TODO extract Link type from logic
export function parseTableItemPropertyValue(
  itemValue?: Details.ItemValue,
): PrimitiveItemValue | Details.LinkValue {
  if (itemValue == null) {
    return '';
  }

  // Primitive Values
  if (
    typeof itemValue === 'string' ||
    typeof itemValue === 'number' ||
    typeof itemValue === 'boolean'
  ) {
    return parseSimpleItemValue(itemValue);
  }

  // Object Values
  const objectValue = itemValue as ObjectItemValue;
  const { type } = objectValue;
  switch (type) {
    case 'code':
    case 'url':
      return String(parseSimpleItemValue(objectValue));
    case 'node':
      return parseNodeValue(objectValue);
    case 'link':
      return objectValue;
    case 'numeric':
      return Number(parseSimpleItemValue(objectValue));
    case 'source-location':
      const { url } = objectValue;
      return String(url);
    case 'subitems':
      // @TODO log verbose first, then implement data type
      logger.debug(`Value type ${ansis.bold('subitems')} is not implemented`);
      return '';
    case 'debugdata':
      // @TODO log verbose first, then implement data type
      logger.debug(`Value type ${ansis.bold('debugdata')} is not implemented`);
      return '';
  }
  // IcuMessage
  return parseSimpleItemValue(objectValue as SimpleItemValue);
}
