import type {Audit} from '@code-pushup/models';
import {getNormalizedConfigForFile} from './runner/normalize-config.js';
import type {StyleLintTarget} from './config.js';


export function auditSlugToFullAudit(slug: string): Audit {
  return {
    slug,
    title: slug,
    docsUrl: `https://stylelint.io/user-guide/rules/${slug}`,
  };
}

export async function getAudits(
  options: Required<Pick<StyleLintTarget, 'stylelintrc'>>,
): Promise<Audit[]> {
  const normalizedConfig = await getNormalizedConfigForFile(options);
  return Object.keys(normalizedConfig.config.rules).map(auditSlugToFullAudit);
}
