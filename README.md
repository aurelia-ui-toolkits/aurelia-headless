# Aurelia Headless

Headless UI components for Aurelia 2, with optional swappable Tailwind CSS themes.

## Packages

- `@aurelia-ui-toolkits/headless`: component primitives and services.
- `@aurelia-ui-toolkits/headless-tailwind`: default Tailwind CSS theme for the components.
- `@aurelia-ui-toolkits/headless-tailwind-compact`: standalone compact Tailwind CSS theme for the components.

## Install

```shell
npm install @aurelia-ui-toolkits/headless @aurelia-ui-toolkits/headless-tailwind
```

Install the compact theme too if you want a denser ready-made theme:

```shell
npm install @aurelia-ui-toolkits/headless-tailwind-compact
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

Themes are just CSS packages. The components do not depend on a specific theme, so swapping the look is usually changing one import.

```ts
// Default theme
import '@aurelia-ui-toolkits/headless-tailwind';

// Compact theme
// import '@aurelia-ui-toolkits/headless-tailwind-compact';
```

Both shipped themes are standalone packages. The compact theme does not layer on top of the default theme, so an app imports one theme package at a time.

Apps can also override tokens by importing custom CSS after the package theme.

```css
@import "@aurelia-ui-toolkits/headless-tailwind";

:root {
  --color-primary-600: #2563eb;
  --color-ring: #93c5fd;
}
```

The theme package also exposes individual CSS files, including `@aurelia-ui-toolkits/headless-tailwind/theme.css`.
That makes it easy to build a custom theme incrementally: import the shared tokens first, then import or replace component theme files one by one.

```css
@import "@aurelia-ui-toolkits/headless-tailwind/theme.css";
@import "@aurelia-ui-toolkits/headless-tailwind/ui-button-theme.css";
@import "./my-card-theme.css";
```

## Demo

https://aurelia-ui-toolkits.github.io/aurelia-headless/

## License

MIT
