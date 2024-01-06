export const invalidColors = [
  /* <named-color> values */
  'color: red;',
  'color: orange;',
  'color: tan;',
  'color: rebeccapurple;',

  /* <hex-color> values */
  'color: #090;',
  'color: #009900;',
  'color: #090a;',
  'color: #009900aa;',

  /* <rgb()> values */
  'color: rgb(34, 12, 64, 0.6);',
  'color: rgba(34, 12, 64, 0.6);',
  'color: rgb(34 12 64 / 0.6);',
  'color: rgba(34 12 64 / 0.3);',
  'color: rgb(34 12 64 / 60%);',
  'color: rgba(34.6 12 64 / 30%);',

  /* <hsl()> values */
  'color: hsl(30, 100%, 50%, 0.6);',
  'color: hsla(30, 100%, 50%, 0.6);',
  'color: hsl(30 100% 50% / 0.6);',
  'color: hsla(30 100% 50% / 0.6);',
  'color: hsl(30 100% 50% / 60%);',
  'color: hsla(30.2 100% 50% / 60%);',

  /* <hwb()> values */
  'color: hwb(90 10% 10%);',
  'color: hwb(90 10% 10% / 0.5);',
  'color: hwb(90deg 10% 10%);',
  'color: hwb(1.5708rad 60% 0%);',
  'color: hwb(0.25turn 0% 40% / 50%);',
];

const validColors = [
  /* Keyword values */
  'color: currentcolor;',

  /* Global values */
  'color: inherit;',
  'color: initial;',
  'color: revert;',
  'color: revert-layer;',
  'color: unset;',
];

export const validStylesMultiLine = `
.my-class {
  background: var(--white);
  color: var(--blue);
}
`;
export const validStylesSingleLine =
  '.my-class {  background: var(--white); color: var(--blue); }';

export const validStyleInline =
  '<div style="background: var(--white); color: var(--blue);"></div>';

export const invalidStyleMulitLine = (rule = invalidColors[0]) => ({
  fileContent: `
  .my-class {
     ${rule}
  }
`,
  rule,
});

export const invalidStyleSingleLine = (rule = invalidColors[0]) => ({
  fileContent: `.my-class { ${rule} }`,
  rule,
});

export const invalidStyleInline = (rule = invalidColors[0]) => ({
  fileContent: `<div style="${rule}"></div>`,
  rule,
});
