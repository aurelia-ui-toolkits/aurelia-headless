# Aurelia Headless

Headless UI components for Aurelia 2, with an optional Tailwind CSS default theme.

## Packages

- `@aurelia-ui-toolkits/headless`: component primitives and services.
- `@aurelia-ui-toolkits/headless-tailwind`: default Tailwind CSS theme for the components.

## Install

```shell
npm install @aurelia-ui-toolkits/headless @aurelia-ui-toolkits/headless-tailwind
```

Install peer dependencies if your app does not already include them:

```shell
npm install aurelia @aurelia/dialog tailwindcss
```

## Register Components

```ts
import Aurelia from 'aurelia';
import { AureliaHeadless } from '@aurelia-ui-toolkits/headless';
import '@aurelia-ui-toolkits/headless-tailwind';
import { MyApp } from './my-app';

Aurelia
  .register(AureliaHeadless)
  .app(MyApp)
  .start();
```

## Use Components

```html
<ui-button data-primary click.trigger="save()">Save</ui-button>
```

## Theme

`@aurelia-ui-toolkits/headless-tailwind` provides a default theme. Apps can override tokens by importing custom CSS after the package theme.

```css
@import "@aurelia-ui-toolkits/headless-tailwind";

:root {
  --color-primary-600: #2563eb;
  --color-ring: #93c5fd;
}
```

The theme package also exposes individual CSS files, including `@aurelia-ui-toolkits/headless-tailwind/theme.css`.

## Demo

https://aurelia-ui-toolkits.github.io/aurelia-headless/

## License

MIT
