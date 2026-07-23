# Changelog

All notable changes to `@aurelia-ui-toolkits/headless` and
`@aurelia-ui-toolkits/headless-tailwind` are documented here. The two packages
are versioned in lockstep.

## [1.1.8]

### Added
- **`as-element` list items** — a host such as
  `<a as-element="ui-list-item" load="...">` is now recognised by the list for
  hover, keyboard navigation and selection, and its resolved router `href` is
  reflected onto the host element (previously the router only assigned it to the
  view model, so anchor-based list items had no DOM `href` and were invisible to
  the list).

## [1.1.7]

### Added
- **Toast action button** — `UiToastOptions.action` (`{ label, handler }`)
  renders a button in the toast; activating it removes the toast and then runs
  the handler (via a `toast-action` event). Toast option types are now exported.
- **Table row hover** — table body rows highlight on hover.

### Fixed
- `ui-datepicker` accepts full ISO datetime values (e.g. `2023-01-01T00:00:00Z`)
  when `time` is off, using the calendar-date portion with no local-timezone
  shift, instead of rendering empty.
- `ui-input` refreshes its inset-label float state (`data-has-value`) on
  `ui-inputmask-change` — a masked programmatic value write fires no
  input/change event, so the label state no longer goes stale.
- `ui-inputmask` uses an options-only constructor when no mask is set.
- Textarea text no longer overflows the inset label.

## [1.1.6]

### Added
- **Motion tokens** — `--ui-duration-fast/base/slow` and
  `--ui-ease-standard/out/emphasized`; components reference them instead of
  hardcoded durations.
- **Elevation tokens** — `--ui-shadow-sm/md/lg/xl/2xl` with deeper dark-mode
  values; components consume them via `box-shadow: var(--ui-shadow-*)`.
- **Target-size guards** — a `::before` hit area keeps the checkbox and tree
  toggle ≥24px (WCAG 2.5.8) even at compact density.
- **Live WCAG contrast badges** in the demo theme builder (ink-on-card,
  ink-on-canvas, button-label), with AA/AAA pass/fail.
- `sideEffects: false` on the components package so consumers can tree-shake
  unused components.
- Generated API reference (typedoc) and this changelog.

### Changed
- **RTL** — non-field components now use logical properties
  (`margin-inline-*`, `padding-inline-*`, `text-start/end`, `ps-/pe-/ms-/me-`).
- Tightened public types (replaced `any`): `ui-list` `items` is now `unknown[]`,
  and the alert-service dialog generics default to `unknown` / `object`.

### Fixed
- Honor `prefers-reduced-motion` (transitions/animations reduced globally).
- Honor `prefers-reduced-transparency` (more-solid modal backdrops).
- Forced-colors / Windows High Contrast: focus rings and selected/checked
  states now expose a system-colour outline.
- Focus rings are keyboard-only (`:focus-visible` / `:has()`), no longer shown
  on mouse focus for non-text controls; the inset-label float still responds to
  any focus.

## [1.1.5]

### Added
- Theme builder in the demo app: single-seed brand ramp, Light/Dark/Custom
  mode, and a copyable `:root` export.

### Fixed
- `ui-chip` now respects density and radius tokens (`--ui-chip-*`).

---

Earlier history is available in the git log.
