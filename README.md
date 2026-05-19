# Aurelia Headless

Headless UI components for Aurelia 2, with an optional Tailwind CSS default theme.

## Packages

- `aurelia-headless`: component primitives and services.
- `aurelia-headless-tailwind`: default Tailwind CSS theme for the components.

## Install

```shell
npm install aurelia-headless aurelia-headless-tailwind
```

Install peer dependencies if your app does not already include them:

```shell
npm install aurelia @aurelia/dialog tailwindcss
```

## Register Components

```ts
import Aurelia from 'aurelia';
import { AureliaHeadless } from 'aurelia-headless';
import 'aurelia-headless-tailwind';
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

`aurelia-headless-tailwind` provides a default theme. Apps can override tokens by importing custom CSS after the package theme.

```css
@import "aurelia-headless-tailwind";

:root {
  --color-primary-600: #2563eb;
  --color-ring: #93c5fd;
}
```

The theme package also exposes individual CSS files, including `aurelia-headless-tailwind/theme.css`.

## Demo

https://aurelia-ui-toolkits.github.io/aurelia-headless/

## License

MIT
