import { details } from './html/details';
import {
  bold as boldHtml,
  code as codeHtml,
  italic as italicHtml,
} from './html/font-style';
import { link as linkHtml } from './html/link';
import { table as tableHtml } from './html/table';
import {
  bold as boldMd,
  code as codeMd,
  italic as italicMd,
  strikeThrough as strikeThroughMd,
} from './md/font-style';
import { h, h1, h2, h3, h4, h5, h6, headline } from './md/headline';
import { image } from './md/image';
import { link as linkMd } from './md/link';
import { indentation, li } from './md/list';
import { paragraphs } from './md/paragraphs';
import { lines, section } from './md/section';
import { table as tableMd } from './md/table';

export { NEW_LINE, SPACE, TAB } from './constants';
export { Hierarchy } from './types';

export const md = {
  bold: boldMd,
  italic: italicMd,
  strikeThrough: strikeThroughMd,
  code: codeMd,
  link: linkMd,
  image,
  headline,
  h,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  indentation,
  lines,
  li,
  section,
  paragraphs,
  table: tableMd,
};

export const html = {
  bold: boldHtml,
  italic: italicHtml,
  code: codeHtml,
  link: linkHtml,
  details,
  table: tableHtml,
};
