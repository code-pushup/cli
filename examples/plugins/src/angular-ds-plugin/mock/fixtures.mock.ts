import { join } from 'node:path';

export const validStyles = (root = '.') => `
@import '${join(root, 'generated-styles.scss')}';

.my-class {
  background: var(--white);
  color: var(--blue);
}
`;

export const invalidStyles = `
.my-class {
  background: var(--white);
}
`;

export const generatedComponentStyles = `
  :root {
    --blue: #1e90ff;
    --white: #ffffff;
  }
`;

export const inlineStylesComponentContent = (stylesContent: string): string => `
@Component({
selector: 'inline-styles-comp',
styles: [\`${stylesContent}\`]
})
export class InlineStylesComponent {

}
`;

export const separateStylesComponentContent = (stylesPath: string): string => `
@Component({
selector: 'separate-styles-comp',
styles: ['${stylesPath}']
})
export class SeparateCssStylesComponent {

}
`;
