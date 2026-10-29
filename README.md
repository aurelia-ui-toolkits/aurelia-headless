# Aurelia Headless

Headless UI components for Aurelia 2, with optional swappable Tailwind CSS themes.

## Packages

- `@aurelia-ui-toolkits/headless`: component primitives and services.
- `@aurelia-ui-toolkits/headless-tailwind`: default Tailwind CSS theme for the components.

## Development tests

Run `npm ci`, then `npm test` to type-check and run the component tests, or `npm run test:watch`
to rerun them during development. To run a single suite, use
`npm run test -w packages/components -- test/select.spec.ts` (or `test/combobox.spec.ts`).

Tests live in `packages/components/test` and mount real Aurelia components and
slotted content with Vitest and jsdom. Suites cover every custom element and
custom attribute, including form controls, navigation, tables, trees, lists,
overlays, datepickers, dialogs, notifications, input masks, resizing, and reorder
gestures. Service tests cover asynchronous requests, timers, progress tracking,
and validation presentation.

Popup geometry and browser layout require browser testing. Tests stub jsdom's
missing resize observer, scrolling, and popover APIs; drag tests supply explicit
bounding rectangles to verify move intent rather than browser layout.

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

## Datepicker default time

Use `default-time="00:00"` on a date-time picker to initialize its popup at midnight
when the field is empty:

```html
<ui-datepicker time default-time="00:00" value.bind="dateTime"
  format="dd/MM/yyyy HH:mm" inputmask-format="dd/MM/yyyy HH:mm"></ui-datepicker>
```

The option accepts 24-hour `HH:mm`. Existing values keep their time, and opening or
cancelling the popup does not populate the field. Date-only pickers ignore the option.
Omitted or invalid defaults retain the current-time behavior. A global fallback is
available through `AureliaHeadlessConfiguration.customize(c => { c.datepicker.defaultTime = '00:00'; })`.

Configure datepicker translations through the customization delegate, updating only the
members you need. The remaining translations keep their defaults:

```typescript
AureliaHeadlessConfiguration.customize(c => {
  c.datepicker.i18n.openPicker = 'Choose date';
  c.datepicker.i18n.ok = 'Confirm';
});
```

## Theme

Themes are just CSS packages. The components do not depend on a specific theme, so applying the ready-made theme is one import.

```ts
import '@aurelia-ui-toolkits/headless-tailwind';
```

Apps can also override tokens from their own CSS. The shipped tokens live in Tailwind's
`theme` cascade layer, so a plain (unlayered) `:root` rule always wins - no matter where the
bundler places the app's stylesheet relative to the theme. An override in `:root` applies in
dark mode as well, so override `:root[data-theme="dark"]` too when a mode needs its own value.

```css
@import "@aurelia-ui-toolkits/headless-tailwind";

:root {
  --color-primary-600: #2563eb;
  --color-ring: #93c5fd;
}
```

Two tokens carry the brand colour as a *foreground* rather than a fill: `--color-accent`
for an outline and its label on the page background (outlined button, outlined badge,
primary chip), and `--color-accent-raised` for brand text on a card or tinted surface
(selected tab or segment, primary badge, sorted table column, breadcrumb hover). They
default to `var(--color-primary-600)` and `var(--color-primary-700)`, so an app that only
recolours the ramp keeps them in step; set them when the brand fill and the brand text
have to differ, which they usually do in dark mode - a fill stays dark enough for
`--color-on-primary` text, while a foreground has to lift off the dark canvas.

```css
:root[data-theme="dark"] {
  --color-primary-600: #2b6658; /* fill: white text sits on it */
  --color-accent: #60d8a6;      /* outline + label on the dark canvas */
}
```

Because the defaults are resolved where they are declared, an app that overrides the ramp
per subtree rather than on `:root` has to set the accent tokens in that same rule.

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
