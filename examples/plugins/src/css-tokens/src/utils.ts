const REGEX_CSS_RGBA = /rgba?\(.*?\)/g;
const REGEX_CSS_HEX = /#[0-9a-f]+/gi;
const REGEX_CSS_HWB = /hwb\(.*?\)/g;
const REGEX_CSS_HSLA = /hsla?\(.*?\)/g;
// @TODO, border-color, color, background-color, outline-color, column-rule-color, fill, stroke
const REGEX_CSS_NAMED_COLORS =
  /(--)?(aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)/gi;
// VARIABLE OK: var(--color-primary); NOT OK: #000000; NOT OK: var(--color-primary, #000000);

/**
 * matches every string, also multiline, that has an import statement importing form a path containing the passed string
 */
export const generatedStylesRegex = (importPath: string): RegExp => {
  // escape special characters in the importPath
  const escapedPath = importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`@import +['"](?:.)*(${escapedPath})[^'"]+['"]`, 'g');
};

export const cssVariablesRegex = /(--(?!semantic)[\w-]+)/gm;
export const angularComponentRegex = /@Component\s*\(\s*\{/m;
export const angularComponentSelectorRegex =
  /(selector)(\s*:\s*['"])([^'"]+)(['"])/m;
export const angularComponentInlineStylesRegex =
  /styles:\s*\[\s*`([^`]+)`\s*\]/m;

export const htmlStyleTagRegex = /<style[^>]*>([^<]+)<\/style>/m;
export const htmlInlineStyleRegex = /style\s*=\s*['"]([^'"]+)['"]/m;

export function retrieveNonVariableCssTokens(fileContent: string): string[] {
  const tokens: string[] = [];
  const cssTokens = [
    ...fileContent.matchAll(REGEX_CSS_RGBA),
    ...fileContent.matchAll(REGEX_CSS_HEX),
    ...fileContent.matchAll(REGEX_CSS_HWB),
    ...fileContent.matchAll(REGEX_CSS_HSLA),
    ...fileContent.matchAll(REGEX_CSS_NAMED_COLORS),
    //...fileContent.matchAll(REGEX_CSS_NAMED_COLORS),
  ];
  for (const token of cssTokens) {
    if (token[0].startsWith('--')) continue; // Ignore variable names
    tokens.push(token[0]);
  }
  return tokens;
}
