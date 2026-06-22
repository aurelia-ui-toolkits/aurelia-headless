export class GetStartedView {
  readonly installCode = 'npm install @aurelia-ui-toolkits/headless @aurelia-ui-toolkits/headless-tailwind';

  readonly registerCode = `import Aurelia from 'aurelia';
import { AureliaHeadlessConfiguration } from '@aurelia-ui-toolkits/headless';
import '@aurelia-ui-toolkits/headless-tailwind';

Aurelia
  .register(AureliaHeadlessConfiguration)
  .app(MyApp)
  .start();`;

  readonly themeImportCode = `import '@aurelia-ui-toolkits/headless-tailwind';
import './styles/brand-theme.css';`;

  readonly customThemeCode = `/* app.css */
@import "@aurelia-ui-toolkits/headless-tailwind/theme.css";
@import "@aurelia-ui-toolkits/headless-tailwind/ui-button-theme.css";
@import "@aurelia-ui-toolkits/headless-tailwind/ui-input-theme.css";

/* Replace any component theme with your own CSS. */
@import "./themes/my-list-theme.css";`;

  readonly brandThemeCode = `/* brand-theme.css */
:root {
  --color-primary-600: #7c3aed;
  --color-primary-700: #6d28d9;
  --color-primary-800: #5b21b6;
  --color-ring: #c4b5fd;

  --color-card: #ffffff;
  --color-card-muted: #f6f2ff;
  --color-card-border: #ddd6fe;
}

:root[data-theme="dark"] {
  --color-primary-600: #a78bfa;
  --color-primary-700: #c4b5fd;
  --color-primary-800: #ddd6fe;
  --color-ring: #8b5cf6;

  --color-card: #171123;
  --color-card-muted: #211834;
  --color-card-border: #4c1d95;
}`;

  readonly componentCode = '<button ui-button primary click.trigger="save()">Save</button>';
}
