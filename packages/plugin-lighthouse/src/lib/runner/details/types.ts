import Details from "lighthouse/types/lhr/audit-details";
import {formatBytes, formatDuration, htmlFormat as html} from "@code-pushup/utils";


export type DOM = {
  append: (v: string) => string
  createComponent: (type: 'crcChain', opt: Record<string, unknown>) => string
};


export function parseNode(node: Details.NodeValue): string {
  const {selector = ''} = node;
  return selector;
}

export function parseType(lhValue: any, heading: Details.TableColumnHeading = {valueType: 'text'} as Details.TableColumnHeading): string {
  const {valueType} = heading;
  const {type = valueType} = lhValue;
  switch (type) {
    case undefined:
      return lhValue.toString() as unknown as string;
    case 'source-location':
      return lhValue?.toString().trim().slice(200);
    case 'url':
      return html.link(lhValue);
    case 'text':
      return lhValue?.toString().trim().slice(500);
    case 'code':
      return html.code(lhValue);
    case 'numeric':
      return lhValue?.toString() ?? '';
    case 'bytes':
      return formatBytes(lhValue);
    case 'ms':
      return formatDuration(lhValue);
    case 'node':
      return parseNode(lhValue as Details.NodeValue);
    case 'subitems':
    case 'debugdata':
      return '';
    default:
      console.log(`Type: ${type} not implemented`);
      return `Type: ${type} not implemented`;
  }
}

