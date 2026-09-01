# Changelog

All notable changes to `@aurelia-ui-toolkits/headless` and
`@aurelia-ui-toolkits/headless-tailwind` are documented here. The two packages
are versioned in lockstep.

## [1.2.0]

### Added
- **`ui-table-column` `movable`** — dragging a movable header reorders the column.
  The table owns the permutation (cells have no backing array): it moves the DOM
  cells of every matching row and re-applies the order to rows the repeater
  renders later (paging, sorting). Only movable headers are drop anchors, so
  immovable edge columns (selection, actions) keep their place; rows with a
  different cell count (colspan summaries) keep their authored order. The order
  persists under `storage-key` alongside column widths, and the table emits a
  bubbling `column-reorder` CustomEvent (`IColumnReorderDetail`: `from`, `to`,
  resulting `order` keys).
- **`ui-table-column` `hideable`** — the header context menu lists hideable
  columns with visibility toggles. Hidden columns get `data-col-hidden` on every
  matching row's cell (`display: none` via the table's injected style, so the
  cells leave layout and the accessibility tree; bindings stay alive). The last
  visible column cannot be hidden. Emits a bubbling `column-visibility`
  CustomEvent (`IColumnVisibilityDetail`: `column`, `visible`, resulting
  `hidden` keys). A column authored with `default-hidden` starts hidden — stored
  user state overrides the default, and reset restores the authored defaults
  (the `hidden` section persists whenever it differs from them, including as an
  explicit empty array).

### Changed
- **`.ui-table` shrink-wraps its table** (`width: fit-content; max-width: 100%`):
  the card — and with it the pagination bar — follows the table's width as
  columns resize, instead of always filling the parent. Consumers wanting the
  old behavior can set `ui-table { width: 100%; }`.
- **Column state storage combined** (breaking for stored state): widths, order,
  and hidden columns persist as one `ui-table:<storage-key>` entry
  (`{ widths, order, hidden }`) instead of `ui-table:<storage-key>:columns`.
  Previously stored widths are ignored; there is no legacy migration.
- The table header context menu's reset action now restores column order and
  visibility as well as widths; the default `resetColumnsText` label changed
  from "Reset column widths" to "Reset columns".

## [1.1.9]

### Added
- **`ui-combobox` `open-on-focus`** (opt-in, default off) — opens the popup when
  the input gains focus; the default still waits for typing, ArrowDown/Up,
  Ctrl+Space, or the chevron.
- **`ui-combobox` `select-on-blur`** (opt-in) — leaving the field with a partly
  typed filter commits the first matching option (mdc-lookup parity).

### Fixed
- `ui-input` refreshes its inset-label float state when the value is set through
  the element API — a programmatic value write fires no input/change event, so
  the float previously went stale (e.g. a lookup setting its filter text).
- `ui-form` buttons in a form row now match the height of field controls
  (which are taller and reserve a subscript line), so they align.

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
