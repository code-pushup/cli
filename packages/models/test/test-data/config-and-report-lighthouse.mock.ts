import { PluginConfig } from '../../src/index';
import { mockConfig, mockReport } from '../schema.mock';

export const lighthousePlugin: () => PluginConfig = () =>
  ({
    runner: {
      command: 'bun',
      args: ['--help'],
      outputPath: 'lighthouse-runner-output.json',
    },
    slug: 'lighthouse',
    title: 'lighthouse',
    description: '',
    docsUrl: `https://github.com/GoogleChrome/lighthouse/tree/main/README.md`,
    groups: [],
    audits: [
      {
        slug: 'is-on-https',
        title: 'Uses HTTPS',
        description:
          "All sites should be protected with HTTPS, even ones that don't handle sensitive data. This includes avoiding [mixed content](https://developers.google.com/web/fundamentals/security/prevent-mixed-content/what-is-mixed-content), where some resources are loaded over HTTP despite the initial request being served over HTTPS. HTTPS prevents intruders from tampering with or passively listening in on the communications between your app and your users, and is a prerequisite for HTTP/2 and many new web platform APIs. [Learn more](https://web.dev/is-on-https/).",
      },
      {
        slug: 'service-worker',
        title:
          'Does not register a service worker that controls page and `start_url`',
        description:
          'The service worker is the technology that enables your app to use many Progressive Web App features, such as offline, add to homescreen, and push notifications. [Learn more](https://web.dev/service-worker/).',
      },
      {
        slug: 'viewport',
        title:
          'Has a `<meta name="viewport">` tag with `width` or `initial-scale`',
        description:
          'A `<meta name="viewport">` not only optimizes your app for mobile screen sizes, but also prevents [a 300 millisecond delay to user input](https://developers.google.com/web/updates/2013/12/300ms-tap-delay-gone-away). [Learn more](https://web.dev/viewport/).',
      },
      {
        slug: 'first-contentful-paint',
        title: 'First Contentful Paint',
        description:
          'First Contentful Paint marks the time at which the first text or image is painted. [Learn more](https://web.dev/first-contentful-paint/).',
      },
      {
        slug: 'largest-contentful-paint',
        title: 'Largest Contentful Paint',
        description:
          'Largest Contentful Paint marks the time at which the largest text or image is painted. [Learn more](https://web.dev/lighthouse-largest-contentful-paint/)',
      },
      {
        slug: 'first-meaningful-paint',
        title: 'First Meaningful Paint',
        description:
          'First Meaningful Paint measures when the primary content of a page is visible. [Learn more](https://web.dev/first-meaningful-paint/).',
      },
      {
        slug: 'speed-index',
        title: 'Speed Index',
        description:
          'Speed Index shows how quickly the contents of a page are visibly populated. [Learn more](https://web.dev/speed-index/).',
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
          'Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms, expressed in milliseconds. [Learn more](https://web.dev/lighthouse-total-blocking-time/).',
      },
      {
        slug: 'max-potential-fid',
        title: 'Max Potential First Input Delay',
        description:
          'The maximum potential First Input Delay that your users could experience is the duration of the longest task. [Learn more](https://web.dev/lighthouse-max-potential-fid/).',
      },
      {
        slug: 'cumulative-layout-shift',
        title: 'Cumulative Layout Shift',
        description:
          'Cumulative Layout Shift measures the movement of visible elements within the viewport. [Learn more](https://web.dev/cls/).',
      },
      {
        slug: 'errors-in-console',
        title: 'Browser errors were logged to the console',
        description:
          'Errors logged to the console indicate unresolved problems. They can come from network request failures and other browser concerns. [Learn more](https://web.dev/errors-in-console/)',
      },
      {
        slug: 'server-response-time',
        title: 'Initial server response time was short',
        description:
          'Keep the server response time for the main document short because all other requests depend on it. [Learn more](https://web.dev/time-to-first-byte/).',
      },
      {
        slug: 'interactive',
        title: 'Time to Interactive',
        description:
          'Time to interactive is the amount of time it takes for the page to become fully interactive. [Learn more](https://web.dev/interactive/).',
      },
      {
        slug: 'user-timings',
        title: 'User Timing marks and measures',
        description:
          "Consider instrumenting your app with the User Timing API to measure your app's real-world performance during key user experiences. [Learn more](https://web.dev/user-timings/).",
      },
      {
        slug: 'critical-request-chains',
        title: 'Avoid chaining critical requests',
        description:
          'The Critical Request Chains below show you what resources are loaded with a high priority. Consider reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load. [Learn more](https://web.dev/critical-request-chains/).',
      },
      {
        slug: 'redirects',
        title: 'Avoid multiple page redirects',
        description:
          'Redirects introduce additional delays before the page can be loaded. [Learn more](https://web.dev/redirects/).',
      },
      {
        slug: 'installable-manifest',
        title:
          'Web app manifest or service worker do not meet the installability requirements',
        description:
          'Service worker is the technology that enables your app to use many Progressive Web App features, such as offline, add to homescreen, and push notifications. With proper service worker and manifest implementations, browsers can proactively prompt users to add your app to their homescreen, which can lead to higher engagement. [Learn more](https://web.dev/installable-manifest/).',
      },
      {
        slug: 'apple-touch-icon',
        title: 'Does not provide a valid `apple-touch-icon`',
        description:
          'For ideal appearance on iOS when users add a progressive web app to the home screen, define an `apple-touch-icon`. It must point to a non-transparent 192px (or 180px) square PNG. [Learn More](https://web.dev/apple-touch-icon/).',
      },
      {
        slug: 'splash-screen',
        title: 'Is not configured for a custom splash screen',
        description:
          'A themed splash screen ensures a high-quality experience when users launch your app from their homescreens. [Learn more](https://web.dev/splash-screen/).',
      },
      {
        slug: 'themed-omnibox',
        title: 'Does not set a theme color for the address bar.',
        description:
          'The browser address bar can be themed to match your site. [Learn more](https://web.dev/themed-omnibox/).',
      },
      {
        slug: 'maskable-icon',
        title: "Manifest doesn't have a maskable icon",
        description:
          'A maskable icon ensures that the image fills the entire shape without being letterboxed when installing the app on a device. [Learn more](https://web.dev/maskable-icon-audit/).',
      },
      {
        slug: 'content-width',
        title: 'Content is sized correctly for the viewport',
        description:
          "If the width of your app's content doesn't match the width of the viewport, your app might not be optimized for mobile screens. [Learn more](https://web.dev/content-width/).",
      },
      {
        slug: 'image-aspect-ratio',
        title: 'Displays images with correct aspect ratio',
        description:
          'Image display dimensions should match natural aspect ratio. [Learn more](https://web.dev/image-aspect-ratio/).',
      },
      {
        slug: 'image-size-responsive',
        title: 'Serves images with appropriate resolution',
        description:
          'Image natural dimensions should be proportional to the display size and the pixel ratio to maximize image clarity. [Learn more](https://web.dev/serve-responsive-images/).',
      },
      {
        slug: 'preload-fonts',
        title: 'Fonts with `font-display: optional` are preloaded',
        description:
          'Preload `optional` fonts so first-time visitors may use them. [Learn more](https://web.dev/preload-optional-fonts/)',
      },
      {
        slug: 'deprecations',
        title: 'Avoids deprecated APIs',
        description:
          'Deprecated APIs will eventually be removed from the browser. [Learn more](https://web.dev/deprecations/).',
      },
      {
        slug: 'mainthread-work-breakdown',
        title: 'Minimizes main-thread work',
        description:
          'Consider reducing the time spent parsing, compiling and executing JS. You may find delivering smaller JS payloads helps with this. [Learn more](https://web.dev/mainthread-work-breakdown/)',
      },
      {
        slug: 'bootup-time',
        title: 'JavaScript execution time',
        description:
          'Consider reducing the time spent parsing, compiling, and executing JS. You may find delivering smaller JS payloads helps with this. [Learn more](https://web.dev/bootup-time/).',
      },
      {
        slug: 'uses-rel-preload',
        title: 'Preload key requests',
        description:
          'Consider using `<link rel=preload>` to prioritize fetching resources that are currently requested later in page load. [Learn more](https://web.dev/uses-rel-preload/).',
      },
      {
        slug: 'uses-rel-preconnect',
        title: 'Preconnect to required origins',
        description:
          'Consider adding `preconnect` or `dns-prefetch` resource hints to establish early connections to important third-party origins. [Learn more](https://web.dev/uses-rel-preconnect/).',
      },
      {
        slug: 'font-display',
        title: 'All text remains visible during webfont loads',
        description:
          'Leverage the font-display CSS feature to ensure text is user-visible while webfonts are loading. [Learn more](https://web.dev/font-display/).',
      },
      {
        slug: 'diagnostics',
        title: 'Diagnostics',
        description: 'Collection of useful page vitals.',
      },
      {
        slug: 'network-requests',
        title: 'Network Requests',
        description:
          'Lists the network requests that were made during page load.',
      },
      {
        slug: 'network-rtt',
        title: 'Network Round Trip Times',
        description:
          "Network round trip times (RTT) have a large impact on performance. If the RTT to an origin is high, it's an indication that servers closer to the user could improve performance. [Learn more](https://hpbn.co/primer-on-latency-and-bandwidth/).",
      },
      {
        slug: 'network-server-latency',
        title: 'Server Backend Latencies',
        description:
          "Server latencies can impact web performance. If the server latency of an origin is high, it's an indication the server is overloaded or has poor backend performance. [Learn more](https://hpbn.co/primer-on-web-performance/#analyzing-the-resource-waterfall).",
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
          'Keep the quantity and size of network requests under the targets set by the provided performance budget. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/budgets).',
      },
      {
        slug: 'timing-budget',
        title: 'Timing budget',
        description:
          'Set a timing budget to help you keep an eye on the performance of your site. Performant sites load fast and respond to user input events quickly. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/budgets).',
      },
      {
        slug: 'resource-summary',
        title: 'Keep request counts low and transfer sizes small',
        description:
          'To set budgets for the quantity and size of page resources, add a budget.json file. [Learn more](https://web.dev/use-lighthouse-for-performance-budgets/).',
      },
      {
        slug: 'third-party-summary',
        title: 'Minimize third-party usage',
        description:
          'Third-party code can significantly impact load performance. Limit the number of redundant third-party providers and try to load third-party code after your page has primarily finished loading. [Learn more](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/loading-third-party-javascript/).',
      },
      {
        slug: 'third-party-facades',
        title: 'Lazy load third-party resources with facades',
        description:
          'Some third-party embeds can be lazy loaded. Consider replacing them with a facade until they are required. [Learn more](https://web.dev/third-party-facades/).',
      },
      {
        slug: 'largest-contentful-paint-element',
        title: 'Largest Contentful Paint element',
        description:
          'This is the largest contentful element painted within the viewport. [Learn More](https://web.dev/lighthouse-largest-contentful-paint/)',
      },
      {
        slug: 'lcp-lazy-loaded',
        title: 'Largest Contentful Paint image was not lazily loaded',
        description:
          'Above-the-fold images that are lazily loaded render later in the page lifecycle, which can delay the largest contentful paint. [Learn more](https://web.dev/lcp-lazy-loading/).',
      },
      {
        slug: 'layout-shift-elements',
        title: 'Avoid large layout shifts',
        description:
          'These DOM elements contribute most to the CLS of the page.',
      },
      {
        slug: 'long-tasks',
        title: 'Avoid long main-thread tasks',
        description:
          'Lists the longest tasks on the main thread, useful for identifying worst contributors to input delay. [Learn more](https://web.dev/long-tasks-devtools/)',
      },
      {
        slug: 'no-unload-listeners',
        title: 'Avoids `unload` event listeners',
        description:
          'The `unload` event does not fire reliably and listening for it can prevent browser optimizations like the Back-Forward Cache. Use `pagehide` or `visibilitychange` events instead. [Learn more](https://web.dev/bfcache/#never-use-the-unload-event)',
      },
      {
        slug: 'non-composited-animations',
        title: 'Avoid non-composited animations',
        description:
          'Animations which are not composited can be janky and increase CLS. [Learn more](https://web.dev/non-composited-animations)',
      },
      {
        slug: 'unsized-images',
        title: 'Image elements have explicit `width` and `height`',
        description:
          'Set an explicit width and height on image elements to reduce layout shifts and improve CLS. [Learn more](https://web.dev/optimize-cls/#images-without-dimensions)',
      },
      {
        slug: 'valid-source-maps',
        title: 'Page has valid source maps',
        description:
          'Source maps translate minified code to the original source code. This helps developers debug in production. In addition, Lighthouse is able to provide further insights. Consider deploying source maps to take advantage of these benefits. [Learn more](https://developers.google.com/web/tools/chrome-devtools/javascript/source-maps).',
      },
      {
        slug: 'preload-lcp-image',
        title: 'Preload Largest Contentful Paint image',
        description:
          'Preload the image used by the LCP element in order to improve your LCP time. [Learn more](https://web.dev/optimize-lcp/#preload-important-resources).',
      },
      {
        slug: 'csp-xss',
        title: 'Ensure CSP is effective against XSS attacks',
        description:
          'A strong Content Security Policy (CSP) significantly reduces the risk of cross-site scripting (XSS) attacks. [Learn more](https://web.dev/csp-xss/)',
      },
      {
        slug: 'full-page-screenshot',
        title: 'Full-page screenshot',
        description: 'A full-height screenshot of the final rendered page',
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
          'To reach the most number of users, sites should work across every major browser. [Learn more](https://web.dev/pwa-cross-browser/).',
      },
      {
        slug: 'pwa-page-transitions',
        title: "Page transitions don't feel like they block on the network",
        description:
          "Transitions should feel snappy as you tap around, even on a slow network. This experience is key to a user's perception of performance. [Learn more](https://web.dev/pwa-page-transitions/).",
      },
      {
        slug: 'pwa-each-page-has-url',
        title: 'Each page has a URL',
        description:
          'Ensure individual pages are deep linkable via URL and that URLs are unique for the purpose of shareability on social media. [Learn more](https://web.dev/pwa-each-page-has-url/).',
      },
      {
        slug: 'accesskeys',
        title: '`[accesskey]` values are unique',
        description:
          'Access keys let users quickly focus a part of the page. For proper navigation, each access key must be unique. [Learn more](https://web.dev/accesskeys/).',
      },
      {
        slug: 'aria-allowed-attr',
        title: '`[aria-*]` attributes match their roles',
        description:
          'Each ARIA `role` supports a specific subset of `aria-*` attributes. Mismatching these invalidates the `aria-*` attributes. [Learn more](https://web.dev/aria-allowed-attr/).',
      },
      {
        slug: 'aria-command-name',
        title:
          '`button`, `link`, and `menuitem` elements have accessible names',
        description:
          "When an element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn more](https://web.dev/aria-name/).",
      },
      {
        slug: 'aria-hidden-body',
        title: '`[aria-hidden="true"]` is not present on the document `<body>`',
        description:
          'Assistive technologies, like screen readers, work inconsistently when `aria-hidden="true"` is set on the document `<body>`. [Learn more](https://web.dev/aria-hidden-body/).',
      },
      {
        slug: 'aria-hidden-focus',
        title:
          '`[aria-hidden="true"]` elements do not contain focusable descendents',
        description:
          'Focusable descendents within an `[aria-hidden="true"]` element prevent those interactive elements from being available to users of assistive technologies like screen readers. [Learn more](https://web.dev/aria-hidden-focus/).',
      },
      {
        slug: 'aria-input-field-name',
        title: 'ARIA input fields have accessible names',
        description:
          "When an input field doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn more](https://web.dev/aria-name/).",
      },
      {
        slug: 'aria-meter-name',
        title: 'ARIA `meter` elements have accessible names',
        description:
          "When an element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn more](https://web.dev/aria-name/).",
      },
      {
        slug: 'aria-progressbar-name',
        title: 'ARIA `progressbar` elements have accessible names',
        description:
          "When a `progressbar` element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn more](https://web.dev/aria-name/).",
      },
      {
        slug: 'aria-required-attr',
        title: '`[role]`s have all required `[aria-*]` attributes',
        description:
          'Some ARIA roles have required attributes that describe the state of the element to screen readers. [Learn more](https://web.dev/aria-required-attr/).',
      },
      {
        slug: 'aria-required-children',
        title:
          'Elements with an ARIA `[role]` that require children to contain a specific `[role]` have all required children.',
        description:
          'Some ARIA parent roles must contain specific child roles to perform their intended accessibility functions. [Learn more](https://web.dev/aria-required-children/).',
      },
      {
        slug: 'aria-required-parent',
        title: '`[role]`s are contained by their required parent element',
        description:
          'Some ARIA child roles must be contained by specific parent roles to properly perform their intended accessibility functions. [Learn more](https://web.dev/aria-required-parent/).',
      },
      {
        slug: 'aria-roles',
        title: '`[role]` values are valid',
        description:
          'ARIA roles must have valid values in order to perform their intended accessibility functions. [Learn more](https://web.dev/aria-roles/).',
      },
      {
        slug: 'aria-toggle-field-name',
        title: 'ARIA toggle fields have accessible names',
        description:
          "When a toggle field doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn more](https://web.dev/aria-name/).",
      },
      {
        slug: 'aria-tooltip-name',
        title: 'ARIA `tooltip` elements have accessible names',
        description:
          "When an element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn more](https://web.dev/aria-name/).",
      },
      {
        slug: 'aria-treeitem-name',
        title: 'ARIA `treeitem` elements have accessible names',
        description:
          "When an element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. [Learn more](https://web.dev/aria-name/).",
      },
      {
        slug: 'aria-valid-attr-value',
        title: '`[aria-*]` attributes have valid values',
        description:
          "Assistive technologies, like screen readers, can't interpret ARIA attributes with invalid values. [Learn more](https://web.dev/aria-valid-attr-value/).",
      },
      {
        slug: 'aria-valid-attr',
        title: '`[aria-*]` attributes are valid and not misspelled',
        description:
          "Assistive technologies, like screen readers, can't interpret ARIA attributes with invalid names. [Learn more](https://web.dev/aria-valid-attr/).",
      },
      {
        slug: 'button-name',
        title: 'Buttons have an accessible name',
        description:
          'When a button doesn\'t have an accessible name, screen readers announce it as "button", making it unusable for users who rely on screen readers. [Learn more](https://web.dev/button-name/).',
      },
      {
        slug: 'bypass',
        title: 'The page contains a heading, skip link, or landmark region',
        description:
          'Adding ways to bypass repetitive content lets keyboard users navigate the page more efficiently. [Learn more](https://web.dev/bypass/).',
      },
      {
        slug: 'color-contrast',
        title:
          'Background and foreground colors have a sufficient contrast ratio',
        description:
          'Low-contrast text is difficult or impossible for many users to read. [Learn more](https://web.dev/color-contrast/).',
      },
      {
        slug: 'definition-list',
        title:
          "`<dl>`'s contain only properly-ordered `<dt>` and `<dd>` groups, `<script>`, `<template>` or `<div>` elements.",
        description:
          'When definition lists are not properly marked up, screen readers may produce confusing or inaccurate output. [Learn more](https://web.dev/definition-list/).',
      },
      {
        slug: 'dlitem',
        title: 'Definition list items are wrapped in `<dl>` elements',
        description:
          'Definition list items (`<dt>` and `<dd>`) must be wrapped in a parent `<dl>` element to ensure that screen readers can properly announce them. [Learn more](https://web.dev/dlitem/).',
      },
      {
        slug: 'document-title',
        title: 'Document has a `<title>` element',
        description:
          'The title gives screen reader users an overview of the page, and search engine users rely on it heavily to determine if a page is relevant to their search. [Learn more](https://web.dev/document-title/).',
      },
      {
        slug: 'duplicate-id-active',
        title: '`[id]` attributes on active, focusable elements are unique',
        description:
          "All focusable elements must have a unique `id` to ensure that they're visible to assistive technologies. [Learn more](https://web.dev/duplicate-id-active/).",
      },
      {
        slug: 'duplicate-id-aria',
        title: 'ARIA IDs are unique',
        description:
          'The value of an ARIA ID must be unique to prevent other instances from being overlooked by assistive technologies. [Learn more](https://web.dev/duplicate-id-aria/).',
      },
      {
        slug: 'form-field-multiple-labels',
        title: 'No form fields have multiple labels',
        description:
          'Form fields with multiple labels can be confusingly announced by assistive technologies like screen readers which use either the first, the last, or all of the labels. [Learn more](https://web.dev/form-field-multiple-labels/).',
      },
      {
        slug: 'frame-title',
        title: '`<frame>` or `<iframe>` elements have a title',
        description:
          'Screen reader users rely on frame titles to describe the contents of frames. [Learn more](https://web.dev/frame-title/).',
      },
      {
        slug: 'heading-order',
        title: 'Heading elements appear in a sequentially-descending order',
        description:
          'Properly ordered headings that do not skip levels convey the semantic structure of the page, making it easier to navigate and understand when using assistive technologies. [Learn more](https://web.dev/heading-order/).',
      },
      {
        slug: 'html-has-lang',
        title: '`<html>` element does not have a `[lang]` attribute',
        description:
          "If a page doesn't specify a lang attribute, a screen reader assumes that the page is in the default language that the user chose when setting up the screen reader. If the page isn't actually in the default language, then the screen reader might not announce the page's text correctly. [Learn more](https://web.dev/html-has-lang/).",
      },
      {
        slug: 'html-lang-valid',
        title: '`<html>` element has a valid value for its `[lang]` attribute',
        description:
          'Specifying a valid [BCP 47 language](https://www.w3.org/International/questions/qa-choosing-language-tags#question) helps screen readers announce text properly. [Learn more](https://web.dev/html-lang-valid/).',
      },
      {
        slug: 'image-alt',
        title: 'Image elements have `[alt]` attributes',
        description:
          'Informative elements should aim for short, descriptive alternate text. Decorative elements can be ignored with an empty alt attribute. [Learn more](https://web.dev/image-alt/).',
      },
      {
        slug: 'input-image-alt',
        title: '`<input type="image">` elements have `[alt]` text',
        description:
          'When an image is being used as an `<input>` button, providing alternative text can help screen reader users understand the purpose of the button. [Learn more](https://web.dev/input-image-alt/).',
      },
      {
        slug: 'label',
        title: 'Form elements have associated labels',
        description:
          'Labels ensure that form controls are announced properly by assistive technologies, like screen readers. [Learn more](https://web.dev/label/).',
      },
      {
        slug: 'link-name',
        title: 'Links have a discernible name',
        description:
          'Link text (and alternate text for images, when used as links) that is discernible, unique, and focusable improves the navigation experience for screen reader users. [Learn more](https://web.dev/link-name/).',
      },
      {
        slug: 'list',
        title:
          'Lists contain only `<li>` elements and script supporting elements (`<script>` and `<template>`).',
        description:
          'Screen readers have a specific way of announcing lists. Ensuring proper list structure aids screen reader output. [Learn more](https://web.dev/list/).',
      },
      {
        slug: 'listitem',
        title:
          'List items (`<li>`) are contained within `<ul>` or `<ol>` parent elements',
        description:
          'Screen readers require list items (`<li>`) to be contained within a parent `<ul>` or `<ol>` to be announced properly. [Learn more](https://web.dev/listitem/).',
      },
      {
        slug: 'meta-refresh',
        title: 'The document does not use `<meta http-equiv="refresh">`',
        description:
          'Users do not expect a page to refresh automatically, and doing so will move focus back to the top of the page. This may create a frustrating or confusing experience. [Learn more](https://web.dev/meta-refresh/).',
      },
      {
        slug: 'meta-viewport',
        title:
          '`[user-scalable="no"]` is not used in the `<meta name="viewport">` element and the `[maximum-scale]` attribute is not less than 5.',
        description:
          'Disabling zooming is problematic for users with low vision who rely on screen magnification to properly see the contents of a web page. [Learn more](https://web.dev/meta-viewport/).',
      },
      {
        slug: 'object-alt',
        title: '`<object>` elements have alternate text',
        description:
          'Screen readers cannot translate non-text content. Adding alternate text to `<object>` elements helps screen readers convey meaning to users. [Learn more](https://web.dev/object-alt/).',
      },
      {
        slug: 'tabindex',
        title: 'No element has a `[tabindex]` value greater than 0',
        description:
          'A value greater than 0 implies an explicit navigation ordering. Although technically valid, this often creates frustrating experiences for users who rely on assistive technologies. [Learn more](https://web.dev/tabindex/).',
      },
      {
        slug: 'td-headers-attr',
        title:
          'Cells in a `<table>` element that use the `[headers]` attribute refer to table cells within the same table.',
        description:
          'Screen readers have features to make navigating tables easier. Ensuring `<td>` cells using the `[headers]` attribute only refer to other cells in the same table may improve the experience for screen reader users. [Learn more](https://web.dev/td-headers-attr/).',
      },
      {
        slug: 'th-has-data-cells',
        title:
          '`<th>` elements and elements with `[role="columnheader"/"rowheader"]` have data cells they describe.',
        description:
          'Screen readers have features to make navigating tables easier. Ensuring table headers always refer to some set of cells may improve the experience for screen reader users. [Learn more](https://web.dev/th-has-data-cells/).',
      },
      {
        slug: 'valid-lang',
        title: '`[lang]` attributes have a valid value',
        description:
          'Specifying a valid [BCP 47 language](https://www.w3.org/International/questions/qa-choosing-language-tags#question) on elements helps ensure that text is pronounced correctly by a screen reader. [Learn more](https://web.dev/valid-lang/).',
      },
      {
        slug: 'video-caption',
        title:
          '`<video>` elements contain a `<track>` element with `[kind="captions"]`',
        description:
          'When a video provides a caption it is easier for deaf and hearing impaired users to access its information. [Learn more](https://web.dev/video-caption/).',
      },
      {
        slug: 'custom-controls-labels',
        title: 'Custom controls have associated labels',
        description:
          'Custom interactive controls have associated labels, provided by aria-label or aria-labelledby. [Learn more](https://web.dev/custom-controls-labels/).',
      },
      {
        slug: 'custom-controls-roles',
        title: 'Custom controls have ARIA roles',
        description:
          'Custom interactive controls have appropriate ARIA roles. [Learn more](https://web.dev/custom-control-roles/).',
      },
      {
        slug: 'focus-traps',
        title: 'User focus is not accidentally trapped in a region',
        description:
          'A user can tab into and out of any control or region without accidentally trapping their focus. [Learn more](https://web.dev/focus-traps/).',
      },
      {
        slug: 'focusable-controls',
        title: 'Interactive controls are keyboard focusable',
        description:
          'Custom interactive controls are keyboard focusable and display a focus indicator. [Learn more](https://web.dev/focusable-controls/).',
      },
      {
        slug: 'interactive-element-affordance',
        title: 'Interactive elements indicate their purpose and state',
        description:
          'Interactive elements, such as links and buttons, should indicate their state and be distinguishable from non-interactive elements. [Learn more](https://web.dev/interactive-element-affordance/).',
      },
      {
        slug: 'logical-tab-order',
        title: 'The page has a logical tab order',
        description:
          'Tabbing through the page follows the visual layout. Users cannot focus elements that are offscreen. [Learn more](https://web.dev/logical-tab-order/).',
      },
      {
        slug: 'managed-focus',
        title: "The user's focus is directed to new content added to the page",
        description:
          "If new content, such as a dialog, is added to the page, the user's focus is directed to it. [Learn more](https://web.dev/managed-focus/).",
      },
      {
        slug: 'offscreen-content-hidden',
        title: 'Offscreen content is hidden from assistive technology',
        description:
          'Offscreen content is hidden with display: none or aria-hidden=true. [Learn more](https://web.dev/offscreen-content-hidden/).',
      },
      {
        slug: 'use-landmarks',
        title: 'HTML5 landmark elements are used to improve navigation',
        description:
          'Landmark elements (<main>, <nav>, etc.) are used to improve the keyboard navigation of the page for assistive technology. [Learn more](https://web.dev/use-landmarks/).',
      },
      {
        slug: 'visual-order-follows-dom',
        title: 'Visual order on the page follows DOM order',
        description:
          'DOM order matches the visual order, improving navigation for assistive technology. [Learn more](https://web.dev/visual-order-follows-dom/).',
      },
      {
        slug: 'uses-long-cache-ttl',
        title: 'Uses efficient cache policy on static assets',
        description:
          'A long cache lifetime can speed up repeat visits to your page. [Learn more](https://web.dev/uses-long-cache-ttl/).',
      },
      {
        slug: 'total-byte-weight',
        title: 'Avoids enormous network payloads',
        description:
          'Large network payloads cost users real money and are highly correlated with long load times. [Learn more](https://web.dev/total-byte-weight/).',
      },
      {
        slug: 'offscreen-images',
        title: 'Defer offscreen images',
        description:
          'Consider lazy-loading offscreen and hidden images after all critical resources have finished loading to lower time to interactive. [Learn more](https://web.dev/offscreen-images/).',
      },
      {
        slug: 'render-blocking-resources',
        title: 'Eliminate render-blocking resources',
        description:
          'Resources are blocking the first paint of your page. Consider delivering critical JS/CSS inline and deferring all non-critical JS/styles. [Learn more](https://web.dev/render-blocking-resources/).',
      },
      {
        slug: 'unminified-css',
        title: 'Minify CSS',
        description:
          'Minifying CSS files can reduce network payload sizes. [Learn more](https://web.dev/unminified-css/).',
      },
      {
        slug: 'unminified-javascript',
        title: 'Minify JavaScript',
        description:
          'Minifying JavaScript files can reduce payload sizes and script parse time. [Learn more](https://web.dev/unminified-javascript/).',
      },
      {
        slug: 'unused-css-rules',
        title: 'Reduce unused CSS',
        description:
          'Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to decrease bytes consumed by network activity. [Learn more](https://web.dev/unused-css-rules/).',
      },
      {
        slug: 'unused-javascript',
        title: 'Reduce unused JavaScript',
        description:
          'Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity. [Learn more](https://web.dev/unused-javascript/).',
      },
      {
        slug: 'modern-image-formats',
        title: 'Serve images in next-gen formats',
        description:
          'Image formats like WebP and AVIF often provide better compression than PNG or JPEG, which means faster downloads and less data consumption. [Learn more](https://web.dev/uses-webp-images/).',
      },
      {
        slug: 'uses-optimized-images',
        title: 'Efficiently encode images',
        description:
          'Optimized images load faster and consume less cellular data. [Learn more](https://web.dev/uses-optimized-images/).',
      },
      {
        slug: 'uses-text-compression',
        title: 'Enable text compression',
        description:
          'Text-based resources should be served with compression (gzip, deflate or brotli) to minimize total network bytes. [Learn more](https://web.dev/uses-text-compression/).',
      },
      {
        slug: 'uses-responsive-images',
        title: 'Properly size images',
        description:
          'Serve images that are appropriately-sized to save cellular data and improve load time. [Learn more](https://web.dev/uses-responsive-images/).',
      },
      {
        slug: 'efficient-animated-content',
        title: 'Use video formats for animated content',
        description:
          'Large GIFs are inefficient for delivering animated content. Consider using MPEG4/WebM videos for animations and PNG/WebP for static images instead of GIF to save network bytes. [Learn more](https://web.dev/efficient-animated-content/)',
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
          "Polyfills and transforms enable legacy browsers to use new JavaScript features. However, many aren't necessary for modern browsers. For your bundled JavaScript, adopt a modern script deployment strategy using module/nomodule feature detection to reduce the amount of code shipped to modern browsers, while retaining support for legacy browsers. [Learn More](https://philipwalton.com/articles/deploying-es2015-code-in-production-today/)",
      },
      {
        slug: 'doctype',
        title: 'Page has the HTML doctype',
        description:
          'Specifying a doctype prevents the browser from switching to quirks-mode. [Learn more](https://web.dev/doctype/).',
      },
      {
        slug: 'charset',
        title: 'Properly defines charset',
        description:
          'A character encoding declaration is required. It can be done with a `<meta>` tag in the first 1024 bytes of the HTML or in the Content-Type HTTP response header. [Learn more](https://web.dev/charset/).',
      },
      {
        slug: 'dom-size',
        title: 'Avoids an excessive DOM size',
        description:
          'A large DOM will increase memory usage, cause longer [style calculations](https://developers.google.com/web/fundamentals/performance/rendering/reduce-the-scope-and-complexity-of-style-calculations), and produce costly [layout reflows](https://developers.google.com/speed/articles/reflow). [Learn more](https://web.dev/dom-size/).',
      },
      {
        slug: 'geolocation-on-start',
        title: 'Avoids requesting the geolocation permission on page load',
        description:
          'Users are mistrustful of or confused by sites that request their location without context. Consider tying the request to a user action instead. [Learn more](https://web.dev/geolocation-on-start/).',
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
          'For users on slow connections, external scripts dynamically injected via `document.write()` can delay page load by tens of seconds. [Learn more](https://web.dev/no-document-write/).',
      },
      {
        slug: 'no-vulnerable-libraries',
        title:
          'Avoids front-end JavaScript libraries with known security vulnerabilities',
        description:
          'Some third-party scripts may contain known security vulnerabilities that are easily identified and exploited by attackers. [Learn more](https://web.dev/no-vulnerable-libraries/).',
      },
      {
        slug: 'js-libraries',
        title: 'Detected JavaScript libraries',
        description:
          'All front-end JavaScript libraries detected on the page. [Learn more](https://web.dev/js-libraries/).',
      },
      {
        slug: 'notification-on-start',
        title: 'Avoids requesting the notification permission on page load',
        description:
          'Users are mistrustful of or confused by sites that request to send notifications without context. Consider tying the request to user gestures instead. [Learn more](https://web.dev/notification-on-start/).',
      },
      {
        slug: 'password-inputs-can-be-pasted-into',
        title: 'Allows users to paste into password fields',
        description:
          'Preventing password pasting undermines good security policy. [Learn more](https://web.dev/password-inputs-can-be-pasted-into/).',
      },
      {
        slug: 'uses-http2',
        title: 'Use HTTP/2',
        description:
          'HTTP/2 offers many benefits over HTTP/1.1, including binary headers and multiplexing. [Learn more](https://web.dev/uses-http2/).',
      },
      {
        slug: 'uses-passive-event-listeners',
        title: 'Uses passive listeners to improve scrolling performance',
        description:
          "Consider marking your touch and wheel event listeners as `passive` to improve your page's scroll performance. [Learn more](https://web.dev/uses-passive-event-listeners/).",
      },
      {
        slug: 'meta-description',
        title: 'Document does not have a meta description',
        description:
          'Meta descriptions may be included in search results to concisely summarize page content. [Learn more](https://web.dev/meta-description/).',
      },
      {
        slug: 'http-status-code',
        title: 'Page has successful HTTP status code',
        description:
          'Pages with unsuccessful HTTP status codes may not be indexed properly. [Learn more](https://web.dev/http-status-code/).',
      },
      {
        slug: 'font-size',
        title: 'Document uses legible font sizes',
        description:
          'Font sizes less than 12px are too small to be legible and require mobile visitors to “pinch to zoom” in order to read. Strive to have >60% of page text ≥12px. [Learn more](https://web.dev/font-size/).',
      },
      {
        slug: 'link-text',
        title: 'Links have descriptive text',
        description:
          'Descriptive link text helps search engines understand your content. [Learn more](https://web.dev/link-text/).',
      },
      {
        slug: 'crawlable-anchors',
        title: 'Links are crawlable',
        description:
          'Search engines may use `href` attributes on links to crawl websites. Ensure that the `href` attribute of anchor elements links to an appropriate destination, so more pages of the site can be discovered. [Learn More](https://support.google.com/webmasters/answer/9112205)',
      },
      {
        slug: 'is-crawlable',
        title: 'Page isn’t blocked from indexing',
        description:
          "Search engines are unable to include your pages in search results if they don't have permission to crawl them. [Learn more](https://web.dev/is-crawable/).",
      },
      {
        slug: 'robots-txt',
        title: 'robots.txt is valid',
        description:
          'If your robots.txt file is malformed, crawlers may not be able to understand how you want your website to be crawled or indexed. [Learn more](https://web.dev/robots-txt/).',
      },
      {
        slug: 'tap-targets',
        title: 'Tap targets are sized appropriately',
        description:
          'Interactive elements like buttons and links should be large enough (48x48px), and have enough space around them, to be easy enough to tap without overlapping onto other elements. [Learn more](https://web.dev/tap-targets/).',
      },
      {
        slug: 'hreflang',
        title: 'Document has a valid `hreflang`',
        description:
          'hreflang links tell search engines what version of a page they should list in search results for a given language or region. [Learn more](https://web.dev/hreflang/).',
      },
      {
        slug: 'plugins',
        title: 'Document avoids plugins',
        description:
          "Search engines can't index plugin content, and many devices restrict plugins or don't support them. [Learn more](https://web.dev/plugins/).",
      },
      {
        slug: 'canonical',
        title: 'Document has a valid `rel=canonical`',
        description:
          'Canonical links suggest which URL to show in search results. [Learn more](https://web.dev/canonical/).',
      },
      {
        slug: 'structured-data',
        title: 'Structured data is valid',
        description:
          'Run the [Structured Data Testing Tool](https://search.google.com/structured-data/testing-tool/) and the [Structured Data Linter](http://linter.structured-data.org/) to validate structured data. [Learn more](https://web.dev/structured-data/).',
      },
    ],
  } satisfies PluginConfig);

export const lighthouseConfig = mockConfig();
lighthouseConfig.plugins = [lighthousePlugin()];
lighthouseConfig.categories = [
  {
    slug: 'performance',
    title: 'Performance',
    refs: [
      {
        slug: 'first-contentful-paint',
        weight: 10,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'interactive', weight: 10, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'speed-index',
        weight: 10,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'total-blocking-time',
        weight: 30,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'largest-contentful-paint',
        weight: 25,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'cumulative-layout-shift',
        weight: 15,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'max-potential-fid',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'first-meaningful-paint',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'render-blocking-resources',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'uses-responsive-images',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'offscreen-images',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'unminified-css',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'unminified-javascript',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'unused-css-rules',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'unused-javascript',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'uses-optimized-images',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'modern-image-formats',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'uses-text-compression',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'uses-rel-preconnect',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'server-response-time',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'redirects',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'uses-rel-preload',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'uses-http2',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'efficient-animated-content',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'duplicated-javascript',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'legacy-javascript',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'preload-lcp-image',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'total-byte-weight',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'uses-long-cache-ttl',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'dom-size',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'critical-request-chains',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'user-timings',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'bootup-time',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'mainthread-work-breakdown',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'font-display', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'resource-summary',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'third-party-summary',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'third-party-facades',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'largest-contentful-paint-element',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'lcp-lazy-loaded',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'layout-shift-elements',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'uses-passive-event-listeners',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'no-document-write',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'long-tasks',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'non-composited-animations',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'unsized-images',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'viewport',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'no-unload-listeners',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'performance-budget',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'timing-budget',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'network-requests',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'network-rtt',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'network-server-latency',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'main-thread-tasks',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'diagnostics',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'metrics', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'screenshot-thumbnails',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'final-screenshot',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'script-treemap-data',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
    ],
  },
  {
    slug: 'accessibility',
    title: 'Accessibility',
    description:
      'These checks highlight opportunities to [improve the accessibility of your web app](https://web.dev/lighthouse-accessibility/). Only a subset of accessibility issues can be automatically detected so manual testing is also encouraged.',
    refs: [
      { slug: 'accesskeys', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'aria-allowed-attr',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-command-name',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-hidden-body',
        weight: 10,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-hidden-focus',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-input-field-name',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-meter-name',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-progressbar-name',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-required-attr',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-required-children',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-required-parent',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-roles',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-toggle-field-name',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-tooltip-name',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-treeitem-name',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-valid-attr-value',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'aria-valid-attr',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'button-name',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'bypass', weight: 3, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'color-contrast',
        weight: 3,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'definition-list',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'dlitem',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'document-title',
        weight: 3,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'duplicate-id-active',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'duplicate-id-aria',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'form-field-multiple-labels',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'frame-title', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'heading-order',
        weight: 2,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'html-has-lang', weight: 3, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'html-lang-valid',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'image-alt', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'input-image-alt',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'label', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'link-name',
        weight: 3,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'list', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'listitem',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'meta-refresh', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'meta-viewport',
        weight: 10,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'object-alt', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'tabindex',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'td-headers-attr',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'th-has-data-cells',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'valid-lang', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'video-caption',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'logical-tab-order',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'focusable-controls',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'interactive-element-affordance',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'managed-focus', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'focus-traps',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'custom-controls-labels',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'custom-controls-roles',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'visual-order-follows-dom',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'offscreen-content-hidden',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'use-landmarks', weight: 0, plugin: 'lighthouse', type: 'audit' },
    ],
  },
  {
    slug: 'best-practices',
    title: 'Best Practices',
    refs: [
      {
        slug: 'is-on-https',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'geolocation-on-start',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'notification-on-start',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'no-vulnerable-libraries',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'csp-xss',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'password-inputs-can-be-pasted-into',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'image-aspect-ratio',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'image-size-responsive',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'preload-fonts',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'doctype', weight: 1, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'charset',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'js-libraries', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'deprecations',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'errors-in-console',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'valid-source-maps',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'inspector-issues',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
    ],
  },
  {
    slug: 'seo',
    title: 'SEO',
    description:
      'These checks ensure that your page is following basic search engine optimization advice. There are many additional factors Lighthouse does not score here that may affect your search ranking, including performance on [Core Web Vitals](https://web.dev/learn-web-vitals/). [Learn more](https://support.google.com/webmasters/answer/35769).',
    refs: [
      { slug: 'viewport', weight: 1, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'document-title',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'meta-description',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'http-status-code',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'link-text', weight: 1, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'crawlable-anchors',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'is-crawlable', weight: 1, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'robots-txt',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'image-alt', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'hreflang',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'canonical', weight: 0, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'font-size',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'plugins', weight: 1, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'tap-targets',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'structured-data',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
    ],
  },
  {
    slug: 'pwa',
    title: 'PWA',
    description:
      'These checks validate the aspects of a Progressive Web App. [Learn more](https://developers.google.com/web/progressive-web-apps/checklist).',
    refs: [
      {
        slug: 'installable-manifest',
        weight: 2,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'service-worker',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'splash-screen',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'themed-omnibox',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'content-width',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'viewport', weight: 2, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'apple-touch-icon',
        weight: 1,
        plugin: 'lighthouse',
        type: 'audit',
      },
      { slug: 'maskable-icon', weight: 1, plugin: 'lighthouse', type: 'audit' },
      {
        slug: 'pwa-cross-browser',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'pwa-page-transitions',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
      {
        slug: 'pwa-each-page-has-url',
        weight: 0,
        plugin: 'lighthouse',
        type: 'audit',
      },
    ],
  },
];

export const lighthouseReport = mockReport({
  pluginSlug: 'lighthouse',
  auditSlug: lighthouseConfig?.plugins?.[0]?.audits.map(a => a.slug),
});
