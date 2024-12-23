import { writeFile } from 'node:fs/promises';
import { transformTSErrorCodeToAuditSlug } from '../../src/lib/runner/utils.js';

/*
transform strictNullChecks to Strict null checks
 */
function formatTitle(description: string = '') {
  return description
    .replace(/-/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

async function fetchJsonFromGitHub(
  url: string,
): Promise<Record<string, { code: number; category: string }>> {
  try {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const response = await fetch(url, {
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch JSON. Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Error fetching JSON: ${(error as Error).message}`);
  }
}

export async function generateAuditsFromGithub() {
  const githubResult = (await fetchJsonFromGitHub(
    'https://raw.githubusercontent.com/microsoft/TypeScript/main/src/compiler/diagnosticMessages.json',
  )) as Record<
    string,
    {
      category: 'Error' | 'Warning' | 'Message';
      code: number;
    }
  >;

  const audits = Object.entries(githubResult)
    .filter(
      ([_, { category }]) => category === 'Error' || category === 'Warning',
    )
    .map(([description, { code }]) => errorToAudit(code, description));

  console.info(
    `Generated ${audits.length} audits in packages/plugin-typescript/src/lib/generated/audits.ts`,
  );

  await writeFile(
    'packages/plugin-typescript/src/lib/generated/audits.ts',
    `
  import type {Audit} from "@code-pushup/models";
  /* eslint-disable max-lines */
  export const AUDITS: Audit[] = ${JSON.stringify(audits, null, 2)};
  /* eslint-enable max-lines */
  `,
  );
}

function errorToAudit(tscode: number, description: string) {
  const slug = transformTSErrorCodeToAuditSlug(tscode);
  return {
    slug,
    title: formatTitle(slug),
    description,
  };
}
