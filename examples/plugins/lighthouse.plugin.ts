import { Result } from 'lighthouse';
import {
  AuditOutputs,
  CategoryRef,
  PluginConfig,
  RunnerConfig,
} from '../../dist/packages/models/src';
import { objectToCliArgs, verboseUtils } from '../../dist/packages/utils/index';
import { AuditGroup } from '../../packages/models/src';

export type LighthouseOptions = {
  url: string;
  onlyAudits?: string;
  verbose?: boolean;
  outputFile?: string;
};

export const pluginSlug = 'lighthouse-plugin';
export const lighthousePluginRecommended: CategoryRef[] = [
  {
    type: 'group',
    slug: 'performance',
    plugin: pluginSlug,
    weight: 1,
  },
];

export const audits = [
  {
    slug: 'is-on-https',
    title: 'Uses HTTPS',
    description:
      "All sites should be protected with HTTPS, even ones that don't handle sensitive data. This includes avoiding [mixed content](https://developers.google.com/web/fundamentals/security/prevent-mixed-content/what-is-mixed-content), where some resources are loaded over HTTP despite the initial request being served over HTTPS. HTTPS prevents intruders from tampering with or passively listening in on the communications between your app and your users, and is a prerequisite for HTTP/2 and many new web platform APIs. [Learn more about HTTPS](https://developer.chrome.com/docs/lighthouse/pwa/is-on-https/).",
  },
  {
    slug: 'viewport',
    title: 'Has a `<meta name="viewport">` tag with `width` or `initial-scale`',
    description:
      'A `<meta name="viewport">` not only optimizes your app for mobile screen sizes, but also prevents [a 300 millisecond delay to user input](https://developer.chrome.com/blog/300ms-tap-delay-gone-away/). [Learn more about using the viewport meta tag](https://developer.chrome.com/docs/lighthouse/pwa/viewport/).',
  },
  {
    slug: 'first-contentful-paint',
    title: 'First Contentful Paint',
    description:
      'First Contentful Paint marks the time at which the first text or image is painted. [Learn more about the First Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/).',
  },
  {
    slug: 'largest-contentful-paint',
    title: 'Largest Contentful Paint',
    description:
      'Largest Contentful Paint marks the time at which the largest text or image is painted. [Learn more about the Largest Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)',
  },
  {
    slug: 'first-meaningful-paint',
    title: 'First Meaningful Paint',
    description:
      'First Meaningful Paint measures when the primary content of a page is visible. [Learn more about the First Meaningful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/first-meaningful-paint/).',
  },
  {
    slug: 'speed-index',
    title: 'Speed Index',
    description:
      'Speed Index shows how quickly the contents of a page are visibly populated. [Learn more about the Speed Index metric](https://developer.chrome.com/docs/lighthouse/performance/speed-index/).',
  },
  {
    slug: 'screenshot-thumbnails',
    title: 'Screenshot Thumbnails',
    description: 'This is what the load of your site looked like.',
  },
  {
    slug: 'final-screenshot',
    title: 'Final Screenshot',
    description: 'The last screenshot captured of the pageload.',
  },
  {
    slug: 'total-blocking-time',
    title: 'Total Blocking Time',
    description:
      'Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms, expressed in milliseconds. [Learn more about the Total Blocking Time metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/).',
  },
  {
    slug: 'max-potential-fid',
    title: 'Max Potential First Input Delay',
    description:
      'The maximum potential First Input Delay that your users could experience is the duration of the longest task. [Learn more about the Maximum Potential First Input Delay metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-max-potential-fid/).',
  },
  {
    slug: 'cumulative-layout-shift',
    title: 'Cumulative Layout Shift',
    description:
      'Cumulative Layout Shift measures the movement of visible elements within the viewport. [Learn more about the Cumulative Layout Shift metric](https://web.dev/articles/cls).',
  },
  {
    slug: 'errors-in-console',
    title: 'No browser errors logged to the console',
    description:
      'Errors logged to the console indicate unresolved problems. They can come from network request failures and other browser concerns. [Learn more about this errors in console diagnostic audit](https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console/)',
  },
  {
    slug: 'server-response-time',
    title: 'Initial server response time was short',
    description:
      'Keep the server response time for the main document short because all other requests depend on it. [Learn more about the Time to First Byte metric](https://developer.chrome.com/docs/lighthouse/performance/time-to-first-byte/).',
  },
  {
    slug: 'interactive',
    title: 'Time to Interactive',
    description:
      'Time to Interactive is the amount of time it takes for the page to become fully interactive. [Learn more about the Time to Interactive metric](https://developer.chrome.com/docs/lighthouse/performance/interactive/).',
  },
  {
    slug: 'user-timings',
    title: 'User Timing marks and measures',
    description:
      "Consider instrumenting your app with the User Timing API to measure your app's real-world performance during key user experiences. [Learn more about User Timing marks](https://developer.chrome.com/docs/lighthouse/performance/user-timings/).",
  },
  {
    slug: 'critical-request-chains',
    title: 'Avoid chaining critical requests',
    description:
      'The Critical Request Chains below show you what resources are loaded with a high priority. Consider reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load. [Learn how to avoid chaining critical requests](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains/).',
  },
  {
    slug: 'redirects',
    title: 'Avoid multiple page redirects',
    description:
      'Redirects introduce additional delays before the page can be loaded. [Learn how to avoid page redirects](https://developer.chrome.com/docs/lighthouse/performance/redirects/).',
  },
  {
    slug: 'installable-manifest',
    title:
      'Web app manifest or service worker do not meet the installability requirements',
    description:
      'Service worker is the technology that enables your app to use many Progressive Web App features, such as offline, add to homescreen, and push notifications. With proper service worker and manifest implementations, browsers can proactively prompt users to add your app to their homescreen, which can lead to higher engagement. [Learn more about manifest installability requirements](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest/).',
  },
  {
    slug: 'splash-screen',
    title: 'Is not configured for a custom splash screen',
    description:
      'A themed splash screen ensures a high-quality experience when users launch your app from their homescreens. [Learn more about splash screens](https://developer.chrome.com/docs/lighthouse/pwa/splash-screen/).',
  },
  {
    slug: 'themed-omnibox',
    title: 'Does not set a theme color for the address bar.',
    description:
      'The browser address bar can be themed to match your site. [Learn more about theming the address bar](https://developer.chrome.com/docs/lighthouse/pwa/themed-omnibox/).',
  },
  {
    slug: 'maskable-icon',
    title: "Manifest doesn't have a maskable icon",
    description:
      'A maskable icon ensures that the image fills the entire shape without being letterboxed when installing the app on a device. [Learn about maskable manifest icons](https://developer.chrome.com/docs/lighthouse/pwa/maskable-icon-audit/).',
  },
  {
    slug: 'content-width',
    title: 'Content is sized correctly for the viewport',
    description:
      "If the width of your app's content doesn't match the width of the viewport, your app might not be optimized for mobile screens. [Learn how to size content for the viewport](https://developer.chrome.com/docs/lighthouse/pwa/content-width/).",
  },
  {
    slug: 'image-aspect-ratio',
    title: 'Displays images with correct aspect ratio',
    description:
      'Image display dimensions should match natural aspect ratio. [Learn more about image aspect ratio](https://developer.chrome.com/docs/lighthouse/best-practices/image-aspect-ratio/).',
  },
  {
    slug: 'image-size-responsive',
    title: 'Serves images with appropriate resolution',
    description:
      'Image natural dimensions should be proportional to the display size and the pixel ratio to maximize image clarity. [Learn how to provide responsive images](https://web.dev/articles/serve-responsive-images).',
  },
  {
    slug: 'preload-fonts',
    title: 'Fonts with `font-display: optional` are preloaded',
    description:
      'Preload `optional` fonts so first-time visitors may use them. [Learn more about preloading fonts](https://web.dev/articles/preload-optional-fonts)',
  },
  {
    slug: 'deprecations',
    title: 'Avoids deprecated APIs',
    description:
      'Deprecated APIs will eventually be removed from the browser. [Learn more about deprecated APIs](https://developer.chrome.com/docs/lighthouse/best-practices/deprecations/).',
  },
  {
    slug: 'mainthread-work-breakdown',
    title: 'Minimize main-thread work',
    description:
      'Consider reducing the time spent parsing, compiling and executing JS. You may find delivering smaller JS payloads helps with this. [Learn how to minimize main-thread work](https://developer.chrome.com/docs/lighthouse/performance/mainthread-work-breakdown/)',
  },
  {
    slug: 'bootup-time',
    title: 'Reduce JavaScript execution time',
    description:
      'Consider reducing the time spent parsing, compiling, and executing JS. You may find delivering smaller JS payloads helps with this. [Learn how to reduce Javascript execution time](https://developer.chrome.com/docs/lighthouse/performance/bootup-time/).',
  },
  {
    slug: 'uses-rel-preload',
    title: 'Preload key requests',
    description:
      'Consider using `<link rel=preload>` to prioritize fetching resources that are currently requested later in page load. [Learn how to preload key requests](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preload/).',
  },
  {
    slug: 'uses-rel-preconnect',
    title: 'Preconnect to required origins',
    description:
      'Consider adding `preconnect` or `dns-prefetch` resource hints to establish early connections to important third-party origins. [Learn how to preconnect to required origins](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect/).',
  },
  {
    slug: 'font-display',
    title: 'All text remains visible during webfont loads',
    description:
      'Leverage the `font-display` CSS feature to ensure text is user-visible while webfonts are loading. [Learn more about `font-display`](https://developer.chrome.com/docs/lighthouse/performance/font-display/).',
  },
  {
    slug: 'diagnostics',
    title: 'Diagnostics',
    description: 'Collection of useful page vitals.',
  },
  {
    slug: 'network-requests',
    title: 'Network Requests',
    description: 'Lists the network requests that were made during page load.',
  },
  {
    slug: 'network-rtt',
    title: 'Network Round Trip Times',
    description:
      "Network round trip times (RTT) have a large impact on performance. If the RTT to an origin is high, it's an indication that servers closer to the user could improve performance. [Learn more about the Round Trip Time](https://hpbn.co/primer-on-latency-and-bandwidth/).",
  },
  {
    slug: 'network-server-latency',
    title: 'Server Backend Latencies',
    description:
      "Server latencies can impact web performance. If the server latency of an origin is high, it's an indication the server is overloaded or has poor backend performance. [Learn more about server response time](https://hpbn.co/primer-on-web-performance/#analyzing-the-resource-waterfall).",
  },
  {
    slug: 'main-thread-tasks',
    title: 'Tasks',
    description:
      'Lists the toplevel main thread tasks that executed during page load.',
  },
  {
    slug: 'metrics',
    title: 'Metrics',
    description: 'Collects all available metrics.',
  },
  {
    slug: 'performance-budget',
    title: 'Performance budget',
    description:
      'Keep the quantity and size of network requests under the targets set by the provided performance budget. [Learn more about performance budgets](https://developers.google.com/web/tools/lighthouse/audits/budgets).',
  },
  {
    slug: 'timing-budget',
    title: 'Timing budget',
    description:
      'Set a timing budget to help you keep an eye on the performance of your site. Performant sites load fast and respond to user input events quickly. [Learn more about performance budgets](https://developers.google.com/web/tools/lighthouse/audits/budgets).',
  },
  {
    slug: 'third-party-summary',
    title: 'Minimize third-party usage',
    description:
      'Third-party code can significantly impact load performance. Limit the number of redundant third-party providers and try to load third-party code after your page has primarily finished loading. [Learn how to minimize third-party impact](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/loading-third-party-javascript/).',
  },
  {
    slug: 'third-party-facades',
    title: 'Lazy load third-party resources with facades',
    description:
      'Some third-party embeds can be lazy loaded. Consider replacing them with a facade until they are required. [Learn how to defer third-parties with a facade](https://developer.chrome.com/docs/lighthouse/performance/third-party-facades/).',
  },
  {
    slug: 'largest-contentful-paint-element',
    title: 'Largest Contentful Paint element',
    description:
      'This is the largest contentful element painted within the viewport. [Learn more about the Largest Contentful Paint element](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)',
  },
  {
    slug: 'lcp-lazy-loaded',
    title: 'Largest Contentful Paint image was not lazily loaded',
    description:
      'Above-the-fold images that are lazily loaded render later in the page lifecycle, which can delay the largest contentful paint. [Learn more about optimal lazy loading](https://web.dev/articles/lcp-lazy-loading).',
  },
  {
    slug: 'layout-shift-elements',
    title: 'Avoid large layout shifts',
    description:
      'These DOM elements contribute most to the CLS of the page. [Learn how to improve CLS](https://web.dev/articles/optimize-cls)',
  },
  {
    slug: 'long-tasks',
    title: 'Avoid long main-thread tasks',
    description:
      'Lists the longest tasks on the main thread, useful for identifying worst contributors to input delay. [Learn how to avoid long main-thread tasks](https://web.dev/articles/long-tasks-devtools)',
  },
  {
    slug: 'no-unload-listeners',
    title: 'Avoids `unload` event listeners',
    description:
      'The `unload` event does not fire reliably and listening for it can prevent browser optimizations like the Back-Forward Cache. Use `pagehide` or `visibilitychange` events instead. [Learn more about unload event listeners](https://web.dev/articles/bfcache#never_use_the_unload_event)',
  },
  {
    slug: 'non-composited-animations',
    title: 'Avoid non-composited animations',
    description:
      'Animations which are not composited can be janky and increase CLS. [Learn how to avoid non-composited animations](https://developer.chrome.com/docs/lighthouse/performance/non-composited-animations/)',
  },
  {
    slug: 'unsized-images',
    title: 'Image elements have explicit `width` and `height`',
    description:
      'Set an explicit width and height on image elements to reduce layout shifts and improve CLS. [Learn how to set image dimensions](https://web.dev/articles/optimize-cls#images_without_dimensions)',
  },
  {
    slug: 'valid-source-maps',
    title: 'Missing source maps for large first-party JavaScript',
    description:
      'Source maps translate minified code to the original source code. This helps developers debug in production. In addition, Lighthouse is able to provide further insights. Consider deploying source maps to take advantage of these benefits. [Learn more about source maps](https://developer.chrome.com/docs/devtools/javascript/source-maps/).',
  },
  {
    slug: 'prioritize-lcp-image',
    title: 'Preload Largest Contentful Paint image',
    description:
      'If the LCP element is dynamically added to the page, you should preload the image in order to improve LCP. [Learn more about preloading LCP elements](https://web.dev/articles/optimize-lcp#optimize_when_the_resource_is_discovered).',
  },
  {
    slug: 'csp-xss',
    title: 'Ensure CSP is effective against XSS attacks',
    description:
      'A strong Content Security Policy (CSP) significantly reduces the risk of cross-site scripting (XSS) attacks. [Learn how to use a CSP to prevent XSS](https://developer.chrome.com/docs/lighthouse/best-practices/csp-xss/)',
  },
  {
    slug: 'script-treemap-data',
    title: 'Script Treemap Data',
    description: 'Used for treemap app',
  },
  {
    slug: 'pwa-cross-browser',
    title: 'Site works cross-browser',
    description:
      'To reach the most number of users, sites should work across every major browser. [Learn about cross-browser compatibility](https://developer.chrome.com/docs/lighthouse/pwa/pwa-cross-browser/).',
  },
  {
    slug: 'pwa-page-transitions',
    title: "Page transitions don't feel like they block on the network",
    description:
      "Transitions should feel snappy as you tap around, even on a slow network. This experience is key to a user's perception of performance. [Learn more about page transitions](https://developer.chrome.com/docs/lighthouse/pwa/pwa-page-transitions/).",
  },
  {
    slug: 'pwa-each-page-has-url',
    title: 'Each page has a URL',
    description:
      'Ensure individual pages are deep linkable via URL and that URLs are unique for the purpose of shareability on social media. [Learn more about providing deep links](https://developer.chrome.com/docs/lighthouse/pwa/pwa-each-page-has-url/).',
  },
  {
    slug: 'accesskeys',
    title: '`[accesskey]` values are unique',
    description:
      'Access keys let users quickly focus a part of the page. For proper navigation, each access key must be unique. [Learn more about access keys](https://dequeuniversity.com/rules/axe/4.8/accesskeys).',
  },
  {
    slug: 'aria-allowed-attr',
    title: '`[aria-*]` attributes match their roles',
    description:
      'Each ARIA `role` supports a specific subset of `aria-*` attributes. Mismatching these invalidates the `aria-*` attributes. [Learn how to match ARIA attributes to their roles](https://dequeuniversity.com/rules/axe/4.8/aria-allowed-attr).',
  },
  {
    slug: 'aria-allowed-role',
    title: 'Values assigned to `role=""` are valid ARIA roles.',
    description:
      'ARIA `role`s enable assistive technologies to know the role of each element on the web page. If the `role` values are misspelled, not existing ARIA `role` values, or abstract roles, then the purpose of the element will not be communicated to users of assistive technologies. [Learn more about ARIA roles](https://dequeuniversity.com/rules/axe/4.8/aria-allowed-roles).',
  },
  {
    slug: 'aria-command-name',
    title: '`button`, `link`, and `menuitem` elements have accessible names',
    description:
      "When an element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn how to make command elements more accessible](https://dequeuniversity.com/rules/axe/4.8/aria-command-name).",
  },
  {
    slug: 'aria-dialog-name',
    title:
      'Elements with `role="dialog"` or `role="alertdialog"` have accessible names.',
    description:
      'ARIA dialog elements without accessible names may prevent screen readers users from discerning the purpose of these elements. [Learn how to make ARIA dialog elements more accessible](https://dequeuniversity.com/rules/axe/4.8/aria-dialog-name).',
  },
  {
    slug: 'aria-hidden-body',
    title: '`[aria-hidden="true"]` is not present on the document `<body>`',
    description:
      'Assistive technologies, like screen readers, work inconsistently when `aria-hidden="true"` is set on the document `<body>`. [Learn how `aria-hidden` affects the document body](https://dequeuniversity.com/rules/axe/4.8/aria-hidden-body).',
  },
  {
    slug: 'aria-hidden-focus',
    title:
      '`[aria-hidden="true"]` elements do not contain focusable descendents',
    description:
      'Focusable descendents within an `[aria-hidden="true"]` element prevent those interactive elements from being available to users of assistive technologies like screen readers. [Learn how `aria-hidden` affects focusable elements](https://dequeuniversity.com/rules/axe/4.8/aria-hidden-focus).',
  },
  {
    slug: 'aria-input-field-name',
    title: 'ARIA input fields have accessible names',
    description:
      "When an input field doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn more about input field labels](https://dequeuniversity.com/rules/axe/4.8/aria-input-field-name).",
  },
  {
    slug: 'aria-meter-name',
    title: 'ARIA `meter` elements have accessible names',
    description:
      "When a meter element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn how to name `meter` elements](https://dequeuniversity.com/rules/axe/4.8/aria-meter-name).",
  },
  {
    slug: 'aria-progressbar-name',
    title: 'ARIA `progressbar` elements have accessible names',
    description:
      "When a `progressbar` element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn how to label `progressbar` elements](https://dequeuniversity.com/rules/axe/4.8/aria-progressbar-name).",
  },
  {
    slug: 'aria-required-attr',
    title: '`[role]`s have all required `[aria-*]` attributes',
    description:
      'Some ARIA roles have required attributes that describe the state of the element to screen readers. [Learn more about roles and required attributes](https://dequeuniversity.com/rules/axe/4.8/aria-required-attr).',
  },
  {
    slug: 'aria-required-children',
    title:
      'Elements with an ARIA `[role]` that require children to contain a specific `[role]` have all required children.',
    description:
      'Some ARIA parent roles must contain specific child roles to perform their intended accessibility functions. [Learn more about roles and required children elements](https://dequeuniversity.com/rules/axe/4.8/aria-required-children).',
  },
  {
    slug: 'aria-required-parent',
    title: '`[role]`s are contained by their required parent element',
    description:
      'Some ARIA child roles must be contained by specific parent roles to properly perform their intended accessibility functions. [Learn more about ARIA roles and required parent element](https://dequeuniversity.com/rules/axe/4.8/aria-required-parent).',
  },
  {
    slug: 'aria-roles',
    title: '`[role]` values are valid',
    description:
      'ARIA roles must have valid values in order to perform their intended accessibility functions. [Learn more about valid ARIA roles](https://dequeuniversity.com/rules/axe/4.8/aria-roles).',
  },
  {
    slug: 'aria-text',
    title:
      'Elements with the `role=text` attribute do not have focusable descendents.',
    description:
      "Adding `role=text` around a text node split by markup enables VoiceOver to treat it as one phrase, but the element's focusable descendents will not be announced. [Learn more about the `role=text` attribute](https://dequeuniversity.com/rules/axe/4.8/aria-text).",
  },
  {
    slug: 'aria-toggle-field-name',
    title: 'ARIA toggle fields have accessible names',
    description:
      "When a toggle field doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn more about toggle fields](https://dequeuniversity.com/rules/axe/4.8/aria-toggle-field-name).",
  },
  {
    slug: 'aria-tooltip-name',
    title: 'ARIA `tooltip` elements have accessible names',
    description:
      "When a tooltip element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn how to name `tooltip` elements](https://dequeuniversity.com/rules/axe/4.8/aria-tooltip-name).",
  },
  {
    slug: 'aria-treeitem-name',
    title: 'ARIA `treeitem` elements have accessible names',
    description:
      "When a `treeitem` element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn more about labeling `treeitem` elements](https://dequeuniversity.com/rules/axe/4.8/aria-treeitem-name).",
  },
  {
    slug: 'aria-valid-attr-value',
    title: '`[aria-*]` attributes have valid values',
    description:
      "Assistive technologies, like screen readers, can't interpret ARIA attributes with invalid values. [Learn more about valid values for ARIA attributes](https://dequeuniversity.com/rules/axe/4.8/aria-valid-attr-value).",
  },
  {
    slug: 'aria-valid-attr',
    title: '`[aria-*]` attributes are valid and not misspelled',
    description:
      "Assistive technologies, like screen readers, can't interpret ARIA attributes with invalid names. [Learn more about valid ARIA attributes](https://dequeuniversity.com/rules/axe/4.8/aria-valid-attr).",
  },
  {
    slug: 'button-name',
    title: 'Buttons do not have an accessible name',
    description:
      'When a button doesn\'t have an accessible name, screen readers announce it as "button", making it unusable for users who rely on screen readers. [Learn how to make buttons more accessible](https://dequeuniversity.com/rules/axe/4.8/button-name).',
  },
  {
    slug: 'bypass',
    title: 'The page contains a heading, skip link, or landmark region',
    description:
      'Adding ways to bypass repetitive content lets keyboard users navigate the page more efficiently. [Learn more about bypass blocks](https://dequeuniversity.com/rules/axe/4.8/bypass).',
  },
  {
    slug: 'color-contrast',
    title:
      'Background and foreground colors do not have a sufficient contrast ratio.',
    description:
      'Low-contrast text is difficult or impossible for many users to read. [Learn how to provide sufficient color contrast](https://dequeuniversity.com/rules/axe/4.8/color-contrast).',
  },
  {
    slug: 'definition-list',
    title:
      "`<dl>`'s contain only properly-ordered `<dt>` and `<dd>` groups, `<script>`, `<template>` or `<div>` elements.",
    description:
      'When definition lists are not properly marked up, screen readers may produce confusing or inaccurate output. [Learn how to structure definition lists correctly](https://dequeuniversity.com/rules/axe/4.8/definition-list).',
  },
  {
    slug: 'dlitem',
    title: 'Definition list items are wrapped in `<dl>` elements',
    description:
      'Definition list items (`<dt>` and `<dd>`) must be wrapped in a parent `<dl>` element to ensure that screen readers can properly announce them. [Learn how to structure definition lists correctly](https://dequeuniversity.com/rules/axe/4.8/dlitem).',
  },
  {
    slug: 'document-title',
    title: 'Document has a `<title>` element',
    description:
      'The title gives screen reader users an overview of the page, and search engine users rely on it heavily to determine if a page is relevant to their search. [Learn more about document titles](https://dequeuniversity.com/rules/axe/4.8/document-title).',
  },
  {
    slug: 'duplicate-id-active',
    title: '`[id]` attributes on active, focusable elements are unique',
    description:
      "All focusable elements must have a unique `id` to ensure that they're visible to assistive technologies. [Learn how to fix duplicate `id`s](https://dequeuniversity.com/rules/axe/4.8/duplicate-id-active).",
  },
  {
    slug: 'duplicate-id-aria',
    title: 'ARIA IDs are unique',
    description:
      'The value of an ARIA ID must be unique to prevent other instances from being overlooked by assistive technologies. [Learn how to fix duplicate ARIA IDs](https://dequeuniversity.com/rules/axe/4.8/duplicate-id-aria).',
  },
  {
    slug: 'empty-heading',
    title: 'All heading elements contain content.',
    description:
      "A heading with no content or inaccessible text prevent screen reader users from accessing information on the page's structure. [Learn more about headings](https://dequeuniversity.com/rules/axe/4.8/empty-heading).",
  },
  {
    slug: 'form-field-multiple-labels',
    title: 'No form fields have multiple labels',
    description:
      'Form fields with multiple labels can be confusingly announced by assistive technologies like screen readers which use either the first, the last, or all of the labels. [Learn how to use form labels](https://dequeuniversity.com/rules/axe/4.8/form-field-multiple-labels).',
  },
  {
    slug: 'frame-title',
    title: '`<frame>` or `<iframe>` elements have a title',
    description:
      'Screen reader users rely on frame titles to describe the contents of frames. [Learn more about frame titles](https://dequeuniversity.com/rules/axe/4.8/frame-title).',
  },
  {
    slug: 'heading-order',
    title: 'Heading elements appear in a sequentially-descending order',
    description:
      'Properly ordered headings that do not skip levels convey the semantic structure of the page, making it easier to navigate and understand when using assistive technologies. [Learn more about heading order](https://dequeuniversity.com/rules/axe/4.8/heading-order).',
  },
  {
    slug: 'html-has-lang',
    title: '`<html>` element has a `[lang]` attribute',
    description:
      "If a page doesn't specify a `lang` attribute, a screen reader assumes that the page is in the default language that the user chose when setting up the screen reader. If the page isn't actually in the default language, then the screen reader might not announce the page's text correctly. [Learn more about the `lang` attribute](https://dequeuniversity.com/rules/axe/4.8/html-has-lang).",
  },
  {
    slug: 'html-lang-valid',
    title: '`<html>` element has a valid value for its `[lang]` attribute',
    description:
      'Specifying a valid [BCP 47 language](https://www.w3.org/International/questions/qa-choosing-language-tags#question) helps screen readers announce text properly. [Learn how to use the `lang` attribute](https://dequeuniversity.com/rules/axe/4.8/html-lang-valid).',
  },
  {
    slug: 'html-xml-lang-mismatch',
    title:
      '`<html>` element has an `[xml:lang]` attribute with the same base language as the `[lang]` attribute.',
    description:
      "If the webpage does not specify a consistent language, then the screen reader might not announce the page's text correctly. [Learn more about the `lang` attribute](https://dequeuniversity.com/rules/axe/4.8/html-xml-lang-mismatch).",
  },
  {
    slug: 'identical-links-same-purpose',
    title: 'Identical links have the same purpose.',
    description:
      "Links with the same destination should have the same description, to help users understand the link's purpose and decide whether to follow it. [Learn more about identical links](https://dequeuniversity.com/rules/axe/4.8/identical-links-same-purpose).",
  },
  {
    slug: 'image-alt',
    title: 'Image elements have `[alt]` attributes',
    description:
      'Informative elements should aim for short, descriptive alternate text. Decorative elements can be ignored with an empty alt attribute. [Learn more about the `alt` attribute](https://dequeuniversity.com/rules/axe/4.8/image-alt).',
  },
  {
    slug: 'image-redundant-alt',
    title:
      'Image elements do not have `[alt]` attributes that are redundant text.',
    description:
      'Informative elements should aim for short, descriptive alternative text. Alternative text that is exactly the same as the text adjacent to the link or image is potentially confusing for screen reader users, because the text will be read twice. [Learn more about the `alt` attribute](https://dequeuniversity.com/rules/axe/4.8/image-redundant-alt).',
  },
  {
    slug: 'input-button-name',
    title: 'Input buttons have discernible text.',
    description:
      'Adding discernable and accessible text to input buttons may help screen reader users understand the purpose of the input button. [Learn more about input buttons](https://dequeuniversity.com/rules/axe/4.8/input-button-name).',
  },
  {
    slug: 'input-image-alt',
    title: '`<input type="image">` elements have `[alt]` text',
    description:
      'When an image is being used as an `<input>` button, providing alternative text can help screen reader users understand the purpose of the button. [Learn about input image alt text](https://dequeuniversity.com/rules/axe/4.8/input-image-alt).',
  },
  {
    slug: 'label-content-name-mismatch',
    title: 'Elements with visible text labels have matching accessible names.',
    description:
      'Visible text labels that do not match the accessible name can result in a confusing experience for screen reader users. [Learn more about accessible names](https://dequeuniversity.com/rules/axe/4.8/label-content-name-mismatch).',
  },
  {
    slug: 'label',
    title: 'Form elements have associated labels',
    description:
      'Labels ensure that form controls are announced properly by assistive technologies, like screen readers. [Learn more about form element labels](https://dequeuniversity.com/rules/axe/4.8/label).',
  },
  {
    slug: 'landmark-one-main',
    title: 'Document has a main landmark.',
    description:
      'One main landmark helps screen reader users navigate a web page. [Learn more about landmarks](https://dequeuniversity.com/rules/axe/4.8/landmark-one-main).',
  },
  {
    slug: 'link-name',
    title: 'Links have a discernible name',
    description:
      'Link text (and alternate text for images, when used as links) that is discernible, unique, and focusable improves the navigation experience for screen reader users. [Learn how to make links accessible](https://dequeuniversity.com/rules/axe/4.8/link-name).',
  },
  {
    slug: 'link-in-text-block',
    title: 'Links are distinguishable without relying on color.',
    description:
      'Low-contrast text is difficult or impossible for many users to read. Link text that is discernible improves the experience for users with low vision. [Learn how to make links distinguishable](https://dequeuniversity.com/rules/axe/4.8/link-in-text-block).',
  },
  {
    slug: 'list',
    title:
      'Lists contain only `<li>` elements and script supporting elements (`<script>` and `<template>`).',
    description:
      'Screen readers have a specific way of announcing lists. Ensuring proper list structure aids screen reader output. [Learn more about proper list structure](https://dequeuniversity.com/rules/axe/4.8/list).',
  },
  {
    slug: 'listitem',
    title:
      'List items (`<li>`) are contained within `<ul>`, `<ol>` or `<menu>` parent elements',
    description:
      'Screen readers require list items (`<li>`) to be contained within a parent `<ul>`, `<ol>` or `<menu>` to be announced properly. [Learn more about proper list structure](https://dequeuniversity.com/rules/axe/4.8/listitem).',
  },
  {
    slug: 'meta-refresh',
    title: 'The document does not use `<meta http-equiv="refresh">`',
    description:
      'Users do not expect a page to refresh automatically, and doing so will move focus back to the top of the page. This may create a frustrating or confusing experience. [Learn more about the refresh meta tag](https://dequeuniversity.com/rules/axe/4.8/meta-refresh).',
  },
  {
    slug: 'meta-viewport',
    title:
      '`[user-scalable="no"]` is not used in the `<meta name="viewport">` element and the `[maximum-scale]` attribute is not less than 5.',
    description:
      'Disabling zooming is problematic for users with low vision who rely on screen magnification to properly see the contents of a web page. [Learn more about the viewport meta tag](https://dequeuniversity.com/rules/axe/4.8/meta-viewport).',
  },
  {
    slug: 'object-alt',
    title: '`<object>` elements have alternate text',
    description:
      'Screen readers cannot translate non-text content. Adding alternate text to `<object>` elements helps screen readers convey meaning to users. [Learn more about alt text for `object` elements](https://dequeuniversity.com/rules/axe/4.8/object-alt).',
  },
  {
    slug: 'select-name',
    title: 'Select elements do not have associated label elements.',
    description:
      'Form elements without effective labels can create frustrating experiences for screen reader users. [Learn more about the `select` element](https://dequeuniversity.com/rules/axe/4.8/select-name).',
  },
  {
    slug: 'skip-link',
    title: 'Skip links are focusable.',
    description:
      'Including a skip link can help users skip to the main content to save time. [Learn more about skip links](https://dequeuniversity.com/rules/axe/4.8/skip-link).',
  },
  {
    slug: 'tabindex',
    title: 'No element has a `[tabindex]` value greater than 0',
    description:
      'A value greater than 0 implies an explicit navigation ordering. Although technically valid, this often creates frustrating experiences for users who rely on assistive technologies. [Learn more about the `tabindex` attribute](https://dequeuniversity.com/rules/axe/4.8/tabindex).',
  },
  {
    slug: 'table-duplicate-name',
    title:
      'Tables have different content in the summary attribute and `<caption>`.',
    description:
      'The summary attribute should describe the table structure, while `<caption>` should have the onscreen title. Accurate table mark-up helps users of screen readers. [Learn more about summary and caption](https://dequeuniversity.com/rules/axe/4.8/table-duplicate-name).',
  },
  {
    slug: 'table-fake-caption',
    title:
      'Tables use `<caption>` instead of cells with the `[colspan]` attribute to indicate a caption.',
    description:
      'Screen readers have features to make navigating tables easier. Ensuring that tables use the actual caption element instead of cells with the `[colspan]` attribute may improve the experience for screen reader users. [Learn more about captions](https://dequeuniversity.com/rules/axe/4.8/table-fake-caption).',
  },
  {
    slug: 'target-size',
    title: 'Touch targets have sufficient size and spacing.',
    description:
      'Touch targets with sufficient size and spacing help users who may have difficulty targeting small controls to activate the targets. [Learn more about touch targets](https://dequeuniversity.com/rules/axe/4.8/target-size).',
  },
  {
    slug: 'td-has-header',
    title:
      '`<td>` elements in a large `<table>` have one or more table headers.',
    description:
      'Screen readers have features to make navigating tables easier. Ensuring that `<td>` elements in a large table (3 or more cells in width and height) have an associated table header may improve the experience for screen reader users. [Learn more about table headers](https://dequeuniversity.com/rules/axe/4.8/td-has-header).',
  },
  {
    slug: 'td-headers-attr',
    title:
      'Cells in a `<table>` element that use the `[headers]` attribute refer to table cells within the same table.',
    description:
      'Screen readers have features to make navigating tables easier. Ensuring `<td>` cells using the `[headers]` attribute only refer to other cells in the same table may improve the experience for screen reader users. [Learn more about the `headers` attribute](https://dequeuniversity.com/rules/axe/4.8/td-headers-attr).',
  },
  {
    slug: 'th-has-data-cells',
    title:
      '`<th>` elements and elements with `[role="columnheader"/"rowheader"]` have data cells they describe.',
    description:
      'Screen readers have features to make navigating tables easier. Ensuring table headers always refer to some set of cells may improve the experience for screen reader users. [Learn more about table headers](https://dequeuniversity.com/rules/axe/4.8/th-has-data-cells).',
  },
  {
    slug: 'valid-lang',
    title: '`[lang]` attributes have a valid value',
    description:
      'Specifying a valid [BCP 47 language](https://www.w3.org/International/questions/qa-choosing-language-tags#question) on elements helps ensure that text is pronounced correctly by a screen reader. [Learn how to use the `lang` attribute](https://dequeuniversity.com/rules/axe/4.8/valid-lang).',
  },
  {
    slug: 'video-caption',
    title:
      '`<video>` elements contain a `<track>` element with `[kind="captions"]`',
    description:
      'When a video provides a caption it is easier for deaf and hearing impaired users to access its information. [Learn more about video captions](https://dequeuniversity.com/rules/axe/4.8/video-caption).',
  },
  {
    slug: 'custom-controls-labels',
    title: 'Custom controls have associated labels',
    description:
      'Custom interactive controls have associated labels, provided by aria-label or aria-labelledby. [Learn more about custom controls and labels](https://developer.chrome.com/docs/lighthouse/accessibility/custom-controls-labels/).',
  },
  {
    slug: 'custom-controls-roles',
    title: 'Custom controls have ARIA roles',
    description:
      'Custom interactive controls have appropriate ARIA roles. [Learn how to add roles to custom controls](https://developer.chrome.com/docs/lighthouse/accessibility/custom-control-roles/).',
  },
  {
    slug: 'focus-traps',
    title: 'User focus is not accidentally trapped in a region',
    description:
      'A user can tab into and out of any control or region without accidentally trapping their focus. [Learn how to avoid focus traps](https://developer.chrome.com/docs/lighthouse/accessibility/focus-traps/).',
  },
  {
    slug: 'focusable-controls',
    title: 'Interactive controls are keyboard focusable',
    description:
      'Custom interactive controls are keyboard focusable and display a focus indicator. [Learn how to make custom controls focusable](https://developer.chrome.com/docs/lighthouse/accessibility/focusable-controls/).',
  },
  {
    slug: 'interactive-element-affordance',
    title: 'Interactive elements indicate their purpose and state',
    description:
      'Interactive elements, such as links and buttons, should indicate their state and be distinguishable from non-interactive elements. [Learn how to decorate interactive elements with affordance hints](https://developer.chrome.com/docs/lighthouse/accessibility/interactive-element-affordance/).',
  },
  {
    slug: 'logical-tab-order',
    title: 'The page has a logical tab order',
    description:
      'Tabbing through the page follows the visual layout. Users cannot focus elements that are offscreen. [Learn more about logical tab ordering](https://developer.chrome.com/docs/lighthouse/accessibility/logical-tab-order/).',
  },
  {
    slug: 'managed-focus',
    title: "The user's focus is directed to new content added to the page",
    description:
      "If new content, such as a dialog, is added to the page, the user's focus is directed to it. [Learn how to direct focus to new content](https://developer.chrome.com/docs/lighthouse/accessibility/managed-focus/).",
  },
  {
    slug: 'offscreen-content-hidden',
    title: 'Offscreen content is hidden from assistive technology',
    description:
      'Offscreen content is hidden with display: none or aria-hidden=true. [Learn how to properly hide offscreen content](https://developer.chrome.com/docs/lighthouse/accessibility/offscreen-content-hidden/).',
  },
  {
    slug: 'use-landmarks',
    title: 'HTML5 landmark elements are used to improve navigation',
    description:
      'Landmark elements (`<main>`, `<nav>`, etc.) are used to improve the keyboard navigation of the page for assistive technology. [Learn more about landmark elements](https://developer.chrome.com/docs/lighthouse/accessibility/use-landmarks/).',
  },
  {
    slug: 'visual-order-follows-dom',
    title: 'Visual order on the page follows DOM order',
    description:
      'DOM order matches the visual order, improving navigation for assistive technology. [Learn more about DOM and visual ordering](https://developer.chrome.com/docs/lighthouse/accessibility/visual-order-follows-dom/).',
  },
  {
    slug: 'uses-long-cache-ttl',
    title: 'Serve static assets with an efficient cache policy',
    description:
      'A long cache lifetime can speed up repeat visits to your page. [Learn more about efficient cache policies](https://developer.chrome.com/docs/lighthouse/performance/uses-long-cache-ttl/).',
  },
  {
    slug: 'total-byte-weight',
    title: 'Avoids enormous network payloads',
    description:
      'Large network payloads cost users real money and are highly correlated with long load times. [Learn how to reduce payload sizes](https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight/).',
  },
  {
    slug: 'offscreen-images',
    title: 'Defer offscreen images',
    description:
      'Consider lazy-loading offscreen and hidden images after all critical resources have finished loading to lower time to interactive. [Learn how to defer offscreen images](https://developer.chrome.com/docs/lighthouse/performance/offscreen-images/).',
  },
  {
    slug: 'render-blocking-resources',
    title: 'Eliminate render-blocking resources',
    description:
      'Resources are blocking the first paint of your page. Consider delivering critical JS/CSS inline and deferring all non-critical JS/styles. [Learn how to eliminate render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources/).',
  },
  {
    slug: 'unminified-css',
    title: 'Minify CSS',
    description:
      'Minifying CSS files can reduce network payload sizes. [Learn how to minify CSS](https://developer.chrome.com/docs/lighthouse/performance/unminified-css/).',
  },
  {
    slug: 'unminified-javascript',
    title: 'Minify JavaScript',
    description:
      'Minifying JavaScript files can reduce payload sizes and script parse time. [Learn how to minify JavaScript](https://developer.chrome.com/docs/lighthouse/performance/unminified-javascript/).',
  },
  {
    slug: 'unused-css-rules',
    title: 'Reduce unused CSS',
    description:
      'Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to decrease bytes consumed by network activity. [Learn how to reduce unused CSS](https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules/).',
  },
  {
    slug: 'unused-javascript',
    title: 'Reduce unused JavaScript',
    description:
      'Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity. [Learn how to reduce unused JavaScript](https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/).',
  },
  {
    slug: 'modern-image-formats',
    title: 'Serve images in next-gen formats',
    description:
      'Image formats like WebP and AVIF often provide better compression than PNG or JPEG, which means faster downloads and less data consumption. [Learn more about modern image formats](https://developer.chrome.com/docs/lighthouse/performance/uses-webp-images/).',
  },
  {
    slug: 'uses-optimized-images',
    title: 'Efficiently encode images',
    description:
      'Optimized images load faster and consume less cellular data. [Learn how to efficiently encode images](https://developer.chrome.com/docs/lighthouse/performance/uses-optimized-images/).',
  },
  {
    slug: 'uses-text-compression',
    title: 'Enable text compression',
    description:
      'Text-based resources should be served with compression (gzip, deflate or brotli) to minimize total network bytes. [Learn more about text compression](https://developer.chrome.com/docs/lighthouse/performance/uses-text-compression/).',
  },
  {
    slug: 'uses-responsive-images',
    title: 'Properly size images',
    description:
      'Serve images that are appropriately-sized to save cellular data and improve load time. [Learn how to size images](https://developer.chrome.com/docs/lighthouse/performance/uses-responsive-images/).',
  },
  {
    slug: 'efficient-animated-content',
    title: 'Use video formats for animated content',
    description:
      'Large GIFs are inefficient for delivering animated content. Consider using MPEG4/WebM videos for animations and PNG/WebP for static images instead of GIF to save network bytes. [Learn more about efficient video formats](https://developer.chrome.com/docs/lighthouse/performance/efficient-animated-content/)',
  },
  {
    slug: 'duplicated-javascript',
    title: 'Remove duplicate modules in JavaScript bundles',
    description:
      'Remove large, duplicate JavaScript modules from bundles to reduce unnecessary bytes consumed by network activity. ',
  },
  {
    slug: 'legacy-javascript',
    title: 'Avoid serving legacy JavaScript to modern browsers',
    description:
      "Polyfills and transforms enable legacy browsers to use new JavaScript features. However, many aren't necessary for modern browsers. For your bundled JavaScript, adopt a modern script deployment strategy using module/nomodule feature detection to reduce the amount of code shipped to modern browsers, while retaining support for legacy browsers. [Learn how to use modern JavaScript](https://web.dev/articles/publish-modern-javascript)",
  },
  {
    slug: 'doctype',
    title: 'Page has the HTML doctype',
    description:
      'Specifying a doctype prevents the browser from switching to quirks-mode. [Learn more about the doctype declaration](https://developer.chrome.com/docs/lighthouse/best-practices/doctype/).',
  },
  {
    slug: 'charset',
    title: 'Properly defines charset',
    description:
      'A character encoding declaration is required. It can be done with a `<meta>` tag in the first 1024 bytes of the HTML or in the Content-Type HTTP response header. [Learn more about declaring the character encoding](https://developer.chrome.com/docs/lighthouse/best-practices/charset/).',
  },
  {
    slug: 'dom-size',
    title: 'Avoids an excessive DOM size',
    description:
      'A large DOM will increase memory usage, cause longer [style calculations](https://developers.google.com/web/fundamentals/performance/rendering/reduce-the-scope-and-complexity-of-style-calculations), and produce costly [layout reflows](https://developers.google.com/speed/articles/reflow). [Learn how to avoid an excessive DOM size](https://developer.chrome.com/docs/lighthouse/performance/dom-size/).',
  },
  {
    slug: 'geolocation-on-start',
    title: 'Avoids requesting the geolocation permission on page load',
    description:
      'Users are mistrustful of or confused by sites that request their location without context. Consider tying the request to a user action instead. [Learn more about the geolocation permission](https://developer.chrome.com/docs/lighthouse/best-practices/geolocation-on-start/).',
  },
  {
    slug: 'inspector-issues',
    title: 'No issues in the `Issues` panel in Chrome Devtools',
    description:
      'Issues logged to the `Issues` panel in Chrome Devtools indicate unresolved problems. They can come from network request failures, insufficient security controls, and other browser concerns. Open up the Issues panel in Chrome DevTools for more details on each issue.',
  },
  {
    slug: 'no-document-write',
    title: 'Avoids `document.write()`',
    description:
      'For users on slow connections, external scripts dynamically injected via `document.write()` can delay page load by tens of seconds. [Learn how to avoid document.write()](https://developer.chrome.com/docs/lighthouse/best-practices/no-document-write/).',
  },
  {
    slug: 'js-libraries',
    title: 'Detected JavaScript libraries',
    description:
      'All front-end JavaScript libraries detected on the page. [Learn more about this JavaScript library detection diagnostic audit](https://developer.chrome.com/docs/lighthouse/best-practices/js-libraries/).',
  },
  {
    slug: 'notification-on-start',
    title: 'Avoids requesting the notification permission on page load',
    description:
      'Users are mistrustful of or confused by sites that request to send notifications without context. Consider tying the request to user gestures instead. [Learn more about responsibly getting permission for notifications](https://developer.chrome.com/docs/lighthouse/best-practices/notification-on-start/).',
  },
  {
    slug: 'paste-preventing-inputs',
    title: 'Allows users to paste into input fields',
    description:
      'Preventing input pasting is a bad practice for the UX, and weakens security by blocking password managers.[Learn more about user-friendly input fields](https://developer.chrome.com/docs/lighthouse/best-practices/paste-preventing-inputs/).',
  },
  {
    slug: 'uses-http2',
    title: 'Use HTTP/2',
    description:
      'HTTP/2 offers many benefits over HTTP/1.1, including binary headers and multiplexing. [Learn more about HTTP/2](https://developer.chrome.com/docs/lighthouse/best-practices/uses-http2/).',
  },
  {
    slug: 'uses-passive-event-listeners',
    title: 'Uses passive listeners to improve scrolling performance',
    description:
      "Consider marking your touch and wheel event listeners as `passive` to improve your page's scroll performance. [Learn more about adopting passive event listeners](https://developer.chrome.com/docs/lighthouse/best-practices/uses-passive-event-listeners/).",
  },
  {
    slug: 'meta-description',
    title: 'Document does not have a meta description',
    description:
      'Meta descriptions may be included in search results to concisely summarize page content. [Learn more about the meta description](https://developer.chrome.com/docs/lighthouse/seo/meta-description/).',
  },
  {
    slug: 'http-status-code',
    title: 'Page has successful HTTP status code',
    description:
      'Pages with unsuccessful HTTP status codes may not be indexed properly. [Learn more about HTTP status codes](https://developer.chrome.com/docs/lighthouse/seo/http-status-code/).',
  },
  {
    slug: 'font-size',
    title: 'Document uses legible font sizes',
    description:
      'Font sizes less than 12px are too small to be legible and require mobile visitors to “pinch to zoom” in order to read. Strive to have >60% of page text ≥12px. [Learn more about legible font sizes](https://developer.chrome.com/docs/lighthouse/seo/font-size/).',
  },
  {
    slug: 'link-text',
    title: 'Links have descriptive text',
    description:
      'Descriptive link text helps search engines understand your content. [Learn how to make links more accessible](https://developer.chrome.com/docs/lighthouse/seo/link-text/).',
  },
  {
    slug: 'crawlable-anchors',
    title: 'Links are crawlable',
    description:
      'Search engines may use `href` attributes on links to crawl websites. Ensure that the `href` attribute of anchor elements links to an appropriate destination, so more pages of the site can be discovered. [Learn how to make links crawlable](https://support.google.com/webmasters/answer/9112205)',
  },
  {
    slug: 'is-crawlable',
    title: 'Page isn’t blocked from indexing',
    description:
      "Search engines are unable to include your pages in search results if they don't have permission to crawl them. [Learn more about crawler directives](https://developer.chrome.com/docs/lighthouse/seo/is-crawlable/).",
  },
  {
    slug: 'robots-txt',
    title: 'robots.txt is not valid',
    description:
      'If your robots.txt file is malformed, crawlers may not be able to understand how you want your website to be crawled or indexed. [Learn more about robots.txt](https://developer.chrome.com/docs/lighthouse/seo/invalid-robots-txt/).',
  },
  {
    slug: 'tap-targets',
    title: 'Tap targets are sized appropriately',
    description:
      'Interactive elements like buttons and links should be large enough (48x48px), or have enough space around them, to be easy enough to tap without overlapping onto other elements. [Learn more about tap targets](https://developer.chrome.com/docs/lighthouse/seo/tap-targets/).',
  },
  {
    slug: 'hreflang',
    title: 'Document has a valid `hreflang`',
    description:
      'hreflang links tell search engines what version of a page they should list in search results for a given language or region. [Learn more about `hreflang`](https://developer.chrome.com/docs/lighthouse/seo/hreflang/).',
  },
  {
    slug: 'plugins',
    title: 'Document avoids plugins',
    description:
      "Search engines can't index plugin content, and many devices restrict plugins or don't support them. [Learn more about avoiding plugins](https://developer.chrome.com/docs/lighthouse/seo/plugins/).",
  },
  {
    slug: 'canonical',
    title: 'Document has a valid `rel=canonical`',
    description:
      'Canonical links suggest which URL to show in search results. [Learn more about canonical links](https://developer.chrome.com/docs/lighthouse/seo/canonical/).',
  },
  {
    slug: 'structured-data',
    title: 'Structured data is valid',
    description:
      'Run the [Structured Data Testing Tool](https://search.google.com/structured-data/testing-tool/) and the [Structured Data Linter](http://linter.structured-data.org/) to validate structured data. [Learn more about Structured Data](https://developer.chrome.com/docs/lighthouse/seo/structured-data/).',
  },
  {
    slug: 'bf-cache',
    title: "Page didn't prevent back/forward cache restoration",
    description:
      'Many navigations are performed by going back to a previous page, or forwards again. The back/forward cache (bfcache) can speed up these return navigations. [Learn more about the bfcache](https://developer.chrome.com/docs/lighthouse/performance/bf-cache/)',
  },
];

const categoryPerfGroup: AuditGroup = {
  slug: 'performance',
  title: 'performance',
  refs: [
    {
      slug: 'first-contentful-paint',
      weight: 10,
    },
    {
      slug: 'largest-contentful-paint',
      weight: 25,
    },
    {
      slug: 'total-blocking-time',
      weight: 30,
    },
    {
      slug: 'cumulative-layout-shift',
      weight: 25,
    },
    {
      slug: 'speed-index',
      weight: 10,
    },
    {
      slug: 'interactive',
      weight: 0,
    },
    {
      slug: 'max-potential-fid',
      weight: 0,
    },
    {
      slug: 'first-meaningful-paint',
      weight: 0,
    },
    {
      slug: 'render-blocking-resources',
      weight: 0,
    },
    {
      slug: 'uses-responsive-images',
      weight: 0,
    },
    {
      slug: 'offscreen-images',
      weight: 0,
    },
    {
      slug: 'unminified-css',
      weight: 0,
    },
    {
      slug: 'unminified-javascript',
      weight: 0,
    },
    {
      slug: 'unused-css-rules',
      weight: 0,
    },
    {
      slug: 'unused-javascript',
      weight: 0,
    },
    {
      slug: 'uses-optimized-images',
      weight: 0,
    },
    {
      slug: 'modern-image-formats',
      weight: 0,
    },
    {
      slug: 'uses-text-compression',
      weight: 0,
    },
    {
      slug: 'uses-rel-preconnect',
      weight: 0,
    },
    {
      slug: 'server-response-time',
      weight: 0,
    },
    {
      slug: 'redirects',
      weight: 0,
    },
    {
      slug: 'uses-rel-preload',
      weight: 0,
    },
    {
      slug: 'uses-http2',
      weight: 0,
    },
    {
      slug: 'efficient-animated-content',
      weight: 0,
    },
    {
      slug: 'duplicated-javascript',
      weight: 0,
    },
    {
      slug: 'legacy-javascript',
      weight: 0,
    },
    {
      slug: 'prioritize-lcp-image',
      weight: 0,
    },
    {
      slug: 'total-byte-weight',
      weight: 0,
    },
    {
      slug: 'uses-long-cache-ttl',
      weight: 0,
    },
    {
      slug: 'dom-size',
      weight: 0,
    },
    {
      slug: 'critical-request-chains',
      weight: 0,
    },
    {
      slug: 'user-timings',
      weight: 0,
    },
    {
      slug: 'bootup-time',
      weight: 0,
    },
    {
      slug: 'mainthread-work-breakdown',
      weight: 0,
    },
    {
      slug: 'font-display',
      weight: 0,
    },
    {
      slug: 'third-party-summary',
      weight: 0,
    },
    {
      slug: 'third-party-facades',
      weight: 0,
    },
    {
      slug: 'largest-contentful-paint-element',
      weight: 0,
    },
    {
      slug: 'lcp-lazy-loaded',
      weight: 0,
    },
    {
      slug: 'layout-shift-elements',
      weight: 0,
    },
    {
      slug: 'uses-passive-event-listeners',
      weight: 0,
    },
    {
      slug: 'no-document-write',
      weight: 0,
    },
    {
      slug: 'long-tasks',
      weight: 0,
    },
    {
      slug: 'non-composited-animations',
      weight: 0,
    },
    {
      slug: 'unsized-images',
      weight: 0,
    },
    {
      slug: 'viewport',
      weight: 0,
    },
    {
      slug: 'bf-cache',
      weight: 0,
    },
    {
      slug: 'performance-budget',
      weight: 0,
    },
    {
      slug: 'timing-budget',
      weight: 0,
    },
    {
      slug: 'network-requests',
      weight: 0,
    },
    {
      slug: 'network-rtt',
      weight: 0,
    },
    {
      slug: 'network-server-latency',
      weight: 0,
    },
    {
      slug: 'main-thread-tasks',
      weight: 0,
    },
    {
      slug: 'diagnostics',
      weight: 0,
    },
    {
      slug: 'metrics',
      weight: 0,
    },
    {
      slug: 'screenshot-thumbnails',
      weight: 0,
    },
    {
      slug: 'final-screenshot',
      weight: 0,
    },
    {
      slug: 'script-treemap-data',
      weight: 0,
    },
  ],
};

/**
 * @example
 * // code-pushup.config.ts
 * import {
 * create as lighthousePlugin,
 * pluginSlug as lighthousePluginSlug,
 * } from 'lighthouse.plugin.ts';
 * export default {
 *   persist: {
 *     outputDir: '.code-pushup',
 *   },
 *   plugins: [
 *     await lighthousePlugin({
 *       url: "angular.dev"
 *     })
 *   ],
 *   categories: [
 *     {
 *       slug: 'performance',
 *       title: 'Performance',
 *       refs: [
 *         ...lighthousePluginRecommended
 *       ]
 *     }
 *   ]
 * }
 *
 */
export async function create(
  options: LighthouseOptions,
): Promise<PluginConfig> {
  return {
    slug: pluginSlug,
    title: 'Lighthouse Plugin',
    icon: 'lighthouse',
    description:
      'A plugin to measure and assert filesize of files in a directory.',
    runner: runnerConfig(options),
    audits,
    groups: [categoryPerfGroup],
  };
}

function runnerConfig(options: LighthouseOptions): PluginConfig['runner'] {
  const {
    url,
    outputFile = 'lighthouse-report.json',
    verbose = false,
    onlyAudits,
  } = options;
  const { log } = verboseUtils(verbose);
  let argsObj: Record<string, any> = {
    _: ['lighthouse', url],
    verbose,
    output: 'json',
    ['output-path']: outputFile,
  };

  if (onlyAudits) {
    argsObj = {
      ...argsObj,
      onlyAudits,
    };
  }

  const lighthouseArgs = objectToCliArgs(argsObj);

  return {
    command: 'npx',
    args: lighthouseArgs,
    outputFile,
    outputTransform: async (output: string): Promise<AuditOutputs> => {
      const lighthouseOutput: Result = JSON.parse(output);
      return lhrToAuditOutputs(lighthouseOutput);
    },
  } satisfies RunnerConfig;
}

function lhrToAuditOutputs(lhr: Result): AuditOutputs {
  return Object.entries(lhr.audits).map(([slug, result]) => {
    return {
      slug,
      score: result.score || 0,
      value: result?.numericValue
        ? parseInt(result.numericValue.toString())
        : 0,
      displayValue: result.displayValue,
      description: result.description,
      // details: result.details as Issue,
    };
  });
}
