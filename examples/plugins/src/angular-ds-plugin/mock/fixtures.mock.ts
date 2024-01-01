import { join } from 'node:path';

export const inlineStylesComponentFileName = 'inline-styles.component.ts';
export const separateCssStylesComponentFileName =
  'separate-css-styles.component.ts';
export const separateCssStylesFileName = 'separate-css-styles.component.css';
export const separateScssStylesComponentFileName =
  'separate-scss-styles.component.ts';
export const separateScssStylesFileName = 'separate-scss-styles.component.scss';
export const generatedStylesScssFileName = 'generated-styles.scss';

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

import {ChangeDetectionStrategy, Component, HostBinding, Input, ViewEncapsulation,} from '@angular/core';

@Component({
  standalone: true,
  selector: 'inline-ui-backdrop',
  template: '',
  styles: [\`${stylesContent}\`],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
})
export class BackdropComponent {
  @HostBinding('class.opened')
  @Input({required: true})
  opened = false;
}
`;

export const separateStylesComponentContent = (stylesPath: string): string => `
import {ChangeDetectionStrategy, Component, HostBinding, Input, ViewEncapsulation} from '@angular/core';

@Component({
  standalone: true,
  selector: 'ui-backdrop',
  template: '',
  styleUrls: ['${stylesPath}'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
})
export class BackdropComponent {
  @HostBinding('class.opened')
  @Input({required: true})
  opened = false;
}
`;
