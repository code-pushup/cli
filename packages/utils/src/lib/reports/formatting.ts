import * as path from 'path';
import {
  AuditReport,
  Issue,
  SourceFileLocation,
  Table,
} from '@code-pushup/models';
import { Hierarchy, NEW_LINE, SPACE, md } from '../text-formats';
import { MdReportOptions } from './generate-md-report';

const { headline, lines, link, section, table } = md;

export function tableSection(
  tableData: Table,
  options?: {
    level?: Hierarchy | 0;
  },
) {
  if (tableData.rows.length === 0) {
    return '';
  }
  const { level = 4 } = options ?? {};
  // if hierarchy is 0 do not apply heading styles
  const render = (h: string, l: Hierarchy | 0) =>
    l === 0 ? h : headline(h, l);
  return lines(
    tableData.title && render(tableData.title, level),
    table(tableData),
  );
}

// @TODO extract `Pick<AuditReport, 'docsUrl' | 'description'>` to a reusable schema and type
export function metaDescription({
  docsUrl,
  description,
}: Pick<AuditReport, 'docsUrl' | 'description'>): string {
  if (docsUrl) {
    const docsLink = link(docsUrl, '📖 Docs');
    if (!description) {
      return section(docsLink);
    }
    const parsedDescription = description.toString().endsWith('```')
      ? `${description}${NEW_LINE + NEW_LINE}`
      : `${description}${SPACE}`;
    return section(`${parsedDescription}${docsLink}`);
  }
  if (description && description.trim().length > 0) {
    return section(description);
  }
  return '';
}

/**
 * Link to local source for IDE
 * @param source
 * @param reportLocation
 *
 * @example
 * linkToLocalSourceInIde({ file: '/src/index.ts'}, {outputDir: '/.code-pushup'}) // [/src/index.ts](../src/index.ts)
 */
export function linkToLocalSourceForIde(
  source: SourceFileLocation,
  options?: Pick<MdReportOptions, 'outputDir'>,
): string {
  const { file, position } = source;

  const unixPath = file.replace(/\\/g, '/');

  const { outputDir } = options ?? {};

  // NOT linkable
  if (!outputDir) {
    return unixPath;
  }

  const relativePath = path.relative(outputDir, unixPath);
  return link(formatFilePosition(relativePath, position), unixPath);
}

export function formatSourceLine(source: SourceFileLocation) {
  const { startLine, endLine } = source?.position ?? {};
  return `${startLine || ''}${
    endLine && startLine !== endLine ? `-${endLine}` : ''
  }`;
}

function formatFilePosition(
  file: string,
  position?: SourceFileLocation['position'],
) {
  if (!position) {
    return file;
  }
  const { startLine, startColumn } = position;

  if (!startLine) {
    return file;
  }

  if (!startColumn) {
    return `${file}:${startLine}`;
  }

  return `${file}:${startLine}:${startColumn}`;
}
