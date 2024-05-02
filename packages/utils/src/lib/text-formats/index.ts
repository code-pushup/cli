import { codeSection } from './html/code-section';
import { style as fontStyleHtml } from './html/font-style';
import { link as linkHtml } from './html/link';
import { table as tableHtml } from './html/table';
import { style as fontStyleMd } from './md/font-style';
import { h, h1, h2, h3, h4, h5, h6, headline } from './md/headline';
import { image } from './md/image';
import { link as linkMd } from './md/link';
import { indentation, li } from './md/list';
import { paragraphs } from './md/paragraphs';
import { lines, section } from './md/section';
import { table as tableMd } from './md/table';
import {details} from "./html/details";

export { NEW_LINE, SPACE, TAB } from './constants';
export { FontStyleShortcuts, Hierarchy, Alignment } from './types';

export const md = {
  fontStyle: fontStyleMd,
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
  fontStyle: fontStyleHtml,
  link: linkHtml,
  codeSection,
  details,
  table: tableHtml,
};
