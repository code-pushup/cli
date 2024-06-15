import chalk from 'chalk';
import type { IcuMessage } from 'lighthouse';
import type Details from 'lighthouse/types/lhr/audit-details';
import {
  formatBytes,
  formatDuration,
  html,
  truncateText,
  ui,
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

  /* eslint-disable no-magic-numbers */
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
      return formatDuration(Number(parsedItemValue));
    case 'node':
      return parseNodeValue(itemValue as Details.NodeValue);
    case 'source-location':
      return truncateText(String(parsedItemValue), 200);
    case 'numeric':
      const num = Number(parsedItemValue);
      if (num.toFixed(3).toString().endsWith('.000')) {
        return String(num);
      }
      return String(num.toFixed(3));
    case 'text':
      return truncateText(String(parsedItemValue), 500);
    case 'multi': // @TODO
      // @TODO log verbose first, then implement data type
      ui().logger.info(`Format type ${chalk.bold('multi')} is not implemented`);
      return '';
    case 'thumbnail': // @TODO
      // @TODO log verbose first, then implement data type
      ui().logger.info(
        `Format type ${chalk.bold('thumbnail')} is not implemented`,
      );
      return '';
    case null:
      return '';
    default:
      return itemValue;
  }
  /* eslint-enable no-magic-numbers */
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
      ui().logger.info(
        `Value type ${chalk.bold('subitems')} is not implemented`,
      );
      return '';
    case 'debugdata':
      // @TODO log verbose first, then implement data type
      ui().logger.info(
        `Value type ${chalk.bold('debugdata')} is not implemented`,
        { silent: true },
      );
      return '';
  }
  // IcuMessage
  return parseSimpleItemValue(objectValue as SimpleItemValue);
}
