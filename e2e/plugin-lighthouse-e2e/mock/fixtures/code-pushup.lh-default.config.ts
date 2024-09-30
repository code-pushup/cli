import { DEFAULT_FLAGS } from 'chrome-launcher/dist/flags.js';
import lighthousePlugin, {
  lighthouseGroupRef,
} from '@code-pushup/lighthouse-plugin';
import type { CoreConfig } from '@code-pushup/models';

export default {
  plugins: [
    await lighthousePlugin('https://codepushup.dev/', {
      // A reduced set of tests to reduce e2e tets time
      onlyAudits: [
        // performance category
        `largest-contentful-paint`,
        // a11y category
        `aria-allowed-attr`,
        // best-practices category
        `deprecations`,
        // seo category
        `hreflang`,
      ],
      chromeFlags: DEFAULT_FLAGS.concat([`--headless`, `--verbose`]),
    }),
  ],
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [lighthouseGroupRef('performance')],
    },
    {
      slug: 'a11y',
      title: 'Accessibility',
      refs: [lighthouseGroupRef('accessibility')],
    },
    {
      slug: 'best-practices',
      title: 'Best Practices',
      refs: [lighthouseGroupRef('best-practices')],
    },
    {
      slug: 'seo',
      title: 'SEO',
      refs: [lighthouseGroupRef('seo')],
    },
  ],
} satisfies CoreConfig;
