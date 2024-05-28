import type { IcuMessage } from 'lighthouse';
import type Details from 'lighthouse/types/lhr/audit-details';
import { formatBytes, formatDuration, html } from '@code-pushup/utils';

export function parseNodeValue(node?: Details.NodeValue): string {
  const { selector = '' } = node ?? {};
  return selector;
}

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

export function trimSlice(item?: PrimitiveItemValue, sliceEnd = 0) {
  const str = String(item).trim();
  return sliceEnd > 0 ? str.slice(0, sliceEnd) : str;
}

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
      // eslint-disable-next-line no-magic-numbers
      return trimSlice((itemValue as Details.SourceLocationValue).url, 200);
    case 'numeric':
      const num = Number(parseTableItemPropertyValue(itemValue));
      // eslint-disable-next-line no-magic-numbers
      if (num.toFixed(3).toString().endsWith('.000')) {
        return trimSlice(num);
      }
      // eslint-disable-next-line no-magic-numbers
      return trimSlice(num.toFixed(3));
    case 'text':
      // eslint-disable-next-line no-magic-numbers
      return trimSlice(parseTableItemPropertyValue(itemValue) as string, 500);
    case 'multi': // @TODO
    case 'thumbnail': // @TODO
      return `Type format: ${itemValueFormat} not implemented.`;
    // case undefined:
    // return parseTableItemPropertyValue(itemValue) as string;
    default:
      return itemValue;
  }
}

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
      return `${type}`; // @TODO
    case 'debugdata':
      return `${type}`; // @TODO
  }
  // IcuMessage
  return parseSimpleItemValue(objectValue as SimpleItemValue);
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
