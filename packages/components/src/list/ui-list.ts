import { bindable, CustomElement, customElement, INode, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import type { IReorderHost } from '../reorder/i-reorder-host';
import { UiListItem } from './ui-list-item';

type ListOrientation = 'vertical' | 'horizontal';

// Items may be hosted on any tag via as-element (e.g. <a as-element="ui-list-item">), so a bare
// tag selector misses them; as-element itself is a compile-time instruction stripped from the
// DOM, so match the ui-list-item class the component template applies to its host instead.
const LIST_ITEM_SELECTOR = 'ui-list-item, .ui-list-item';

@customElement('ui-list')
export class UiList implements IReorderHost {
  private readonly host = resolve(INode) as HTMLElement;
  private scrollerEl!: HTMLElement;
  private listItems: UiListItem[] = [];
  private listItemsChangedCallback: (() => void) | undefined;
  activeItem: unknown;
  /**
   * The rendered item the activation originated from. Hover/keyboard highlighting is
   * instance-based so duplicate values do not light up together; selection stays value-keyed
   * by design - a selected value renders (and drags) all of its rows.
   */
  activeListItem: UiListItem | undefined;
  /** Anchor item for shift-range selection in multiple mode. */
  private selectionAnchor: unknown;
  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  /** Sentinel default; if `items` still references this, no consumer/enhancer binding supplied items. */
  private readonly defaultItems: unknown[] = [];

  @bindable
  items: unknown[] = this.defaultItems;
  itemsChanged(): void {
    // Ignore our own slot-derived assignment; any other (consumer/enhancer) binding means the
    // items are externally owned and must never be overwritten by slot derivation.
    if (this.derivingItems) {
      return;
    }
    this.itemsExternallyProvided = true;
    this.slotDerivedItems = false;
  }

  /** True while we are assigning `items` ourselves from the slotted list-items. */
  private derivingItems = false;
  /** True once a consumer/enhancer binding has supplied `items`. */
  private itemsExternallyProvided = false;

  bound(): void {
    // itemsChanged does not fire for the initial bound value, so detect an external items binding
    // here: if `items` no longer references the sentinel default, a binding replaced it.
    if (this.items !== this.defaultItems) {
      this.itemsExternallyProvided = true;
    }
  }

  @bindable({ set: booleanAttr })
  loop: boolean = true;

  @bindable({ set: booleanAttr })
  multiple: boolean = false;
  multipleChanged(): void {
    this.syncListItemSelection();
  }

  @bindable({ set: booleanAttr })
  toggleSelection: boolean = false;

  @bindable
  orientation: ListOrientation = 'vertical';

  @bindable
  typeaheadField: string | undefined;

  @bindable
  disabledField: string | ((item: unknown) => boolean) = 'disabled';

  @bindable({ mode: 'twoWay' })
  selected: unknown;
  selectedChanged(): void {
    this.syncListItemSelection();
  }

  /** True while `items` is derived from the slotted list-items (not provided by the consumer). */
  private slotDerivedItems = false;

  @slotted(LIST_ITEM_SELECTOR)
  listItemElements: HTMLElement[] = [];
  listItemElementsChanged() {
    this.listItems = this.listItemElements.map(element => CustomElement.for<UiListItem>(element).viewModel);
    // Keep derived items in sync when the rendered set changes (e.g. items with if.bind),
    // but never overwrite a consumer/enhancer-provided `items` binding (which would otherwise
    // fight that binding and, with extra static items, grow the list every cycle).
    if (!this.itemsExternallyProvided && (!this.items.length || this.slotDerivedItems)) {
      this.derivingItems = true;
      this.items = this.listItems.map(x => x.value);
      this.derivingItems = false;
      this.slotDerivedItems = true;
    }
    this.syncListItemSelection();
    // Re-anchor the active row when the rendered set changed (e.g. a virtual repeat window moved).
    if (this.activeItem !== undefined && (!this.activeListItem || !this.listItems.includes(this.activeListItem))) {
      this.activeListItem = this.listItems.find(x => x.value === this.activeItem);
    }
    if (this.listItemsChangedCallback) {
      this.listItemsChangedCallback();
      this.listItemsChangedCallback = undefined;
    }
  }

  detaching(): void {
    this.clearTypeahead();
  }

  onKeyDown(event: KeyboardEvent): void {
    // Don't hijack keys (typeahead/navigation) when focus is in an editable control such as a
    // search box nested in the list — preventing default there would block typing.
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    const values = this.getEffectiveItems();
    if (values.length === 0) {
      return;
    }

    if (this.multiple && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.selected = values.filter(v => !this.isItemDisabled(v));
      this.syncListItemSelection();
      return;
    }

    if (this.isNextKey(event.key)) {
      event.preventDefault();
      this.move(1);
      return;
    }

    if (this.isPreviousKey(event.key)) {
      event.preventDefault();
      this.move(-1);
      return;
    }

    if (event.key === Keys.Home) {
      event.preventDefault();
      this.setFirstActive();
      return;
    }

    if (event.key === Keys.End) {
      event.preventDefault();
      this.setLastActive();
      return;
    }

    if (event.key === Keys.Enter) {
      event.preventDefault();
      this.selectActive();
      return;
    }

    if (this.isTypeaheadKey(event)) {
      event.preventDefault();
      this.handleTypeahead(event.key.toLowerCase());
    }
  }

  /** Feed a character into typeahead (used by ui-select to forward the first keystroke). */
  typeahead(char: string): void {
    this.handleTypeahead(char.toLowerCase());
  }

  isItemDisabled(item: unknown): boolean {
    const listItem = this.listItems.find(x => x.value === item);
    if (listItem) {
      return listItem.disabled;
    }

    if (typeof this.disabledField === 'string') {
      return !!(item as Record<string, unknown>)[this.disabledField];
    } else if (typeof this.disabledField === 'function') {
      return this.disabledField(item);
    }

    return false;
  }

  isItemSelected(item: unknown): boolean {
    return Array.isArray(this.selected)
      ? this.selected.includes(item)
      : this.selected === item;
  }

  syncListItemSelection(): void {
    for (const item of this.listItems) {
      item.selected = this.isItemSelected(item.value);
    }
  }

  onClick(event: MouseEvent): void {
    const element = this.resolveElementFromEvent(event.target);
    if (!element) {
      return;
    }
    const listItem = CustomElement.for<UiListItem>(element).viewModel;
    if (listItem.disabled) {
      return;
    }
    if (listItem.nonSelectable) {
      // Non-selectable items are actions: signal activation (used to close menus) without selecting.
      this.host.dispatchEvent(new CustomEvent('list-action', { bubbles: true }));
      return;
    }

    this.selectItem(listItem.value, event, listItem);
  }

  private suppressMouseOver = false;

  onMouseMove(): void {
    if (this.suppressMouseOver) {
      this.suppressMouseOver = false;
    }
  }

  onMouseOver(event: MouseEvent): void {
    if (this.suppressMouseOver) {
      return;
    }
    const element = this.resolveElementFromEvent(event.target);
    if (!element) {
      return;
    }
    const listItem = CustomElement.for<UiListItem>(element).viewModel;
    if (listItem.disabled) {
      return;
    }

    this.activateItem(listItem.value, listItem);
  }

  onMouseLeave(): void {
    this.activeItem = undefined;
    this.activeListItem = undefined;
  }

  clearActive(): void {
    this.activeItem = undefined;
    this.activeListItem = undefined;
  }

  suppressNextMouseOver(): void {
    this.suppressMouseOver = true;
  }

  focusFirst(): void {
    this.host.focus();
    this.setFirstActive();
  }

  focusLast(): void {
    this.host.focus();
    this.setLastActive();
  }

  focusSelected(): void {
    this.host.focus();
    this.setSelectedActive();
  }

  private getEffectiveItems(): unknown[] {
    if (!this.items?.length) {
      return this.listItems.map(item => item.value);
    }

    // `items` holds the bound option values; static list-items (e.g. a null/placeholder option)
    // are rendered but absent from it. Merge those rendered values so they stay navigable,
    // keeping DOM order and appending any bound items not currently rendered (virtual-repeat).
    const rendered = this.listItems.map(item => item.value);
    if (rendered.every(value => this.items.includes(value))) {
      return this.items;
    }

    const merged: unknown[] = [...rendered];
    for (const value of this.items) {
      if (!merged.includes(value)) {
        merged.push(value);
      }
    }
    return merged;
  }

  private isNextKey(key: string): boolean {
    if (this.orientation === 'horizontal') {
      return key === Keys.ArrowRight;
    }

    return key === Keys.ArrowDown;
  }

  private isPreviousKey(key: string): boolean {
    if (this.orientation === 'horizontal') {
      return key === Keys.ArrowLeft;
    }

    return key === Keys.ArrowUp;
  }

  private move(direction: 1 | -1): void {
    const items = this.getEffectiveItems();
    const currentIndex = this.activeItem !== undefined ? items.indexOf(this.activeItem) : -1;
    let nextIndex = currentIndex + direction;

    if (this.loop) {
      nextIndex = (nextIndex + items.length) % items.length;
    } else {
      nextIndex = Math.max(0, Math.min(items.length - 1, nextIndex));
    }

    const next = this.getNonDisabled(items[nextIndex], direction, items);
    if (next !== undefined) {
      this.scrollItemIntoView(next);
      this.activateItem(next);
    }
  }

  private getNonDisabled(item: unknown, direction: 1 | -1, items = this.getEffectiveItems()): unknown {
    const listItem = this.listItems.find(x => x.value === item);
    if (!listItem?.disabled && !this.isItemDisabled(item)) {
      return item;
    }
    const startIndex = items.indexOf(item);
    for (let step = 1; step < items.length; step++) {
      const index = (startIndex + direction * step + items.length) % items.length;
      const next = items[index];
      const nextListItem = this.listItems.find(x => x.value === next);
      if (!nextListItem?.disabled && !this.isItemDisabled(next)) {
        return next;
      }
    }

    return undefined;
  }

  private async setFirstActive() {
    const items = this.getEffectiveItems();
    const firstItem = this.getNonDisabled(items[0], 1, items);
    if (firstItem === undefined) {
      return;
    }

    this.scrollItemIntoView(firstItem, 'instant');
    this.activateItem(firstItem);
  }

  private setLastActive(): void {
    const items = this.getEffectiveItems();
    const lastItem = this.getNonDisabled(items[items.length - 1], -1, items);
    if (lastItem === undefined) {
      return;
    }

    this.scrollItemIntoView(lastItem, 'instant');
    this.activateItem(lastItem);
  }

  private setSelectedActive(): void {
    const selected = Array.isArray(this.selected) ? this.selected[0] : this.selected;
    if (selected === undefined) {
      return;
    }

    this.scrollItemIntoView(selected, 'instant');
    this.activateItem(selected);
  }

  private activateItem(item: unknown, source?: UiListItem): void {
    this.activeItem = item;
    this.activeListItem = source ?? this.listItems.find(x => x.value === item);
    this.emitActivate(item);
  }

  private selectActive(): void {
    if (this.activeItem === undefined) {
      return;
    }
    const listItem = this.listItems.find(x => x.value === this.activeItem);
    if (listItem?.disabled) {
      return;
    }
    if (listItem?.nonSelectable) {
      // Activate the action item as a click would: runs its click handler and emits list-action (closes menus).
      listItem.element.click();
      return;
    }
    this.selectItem(this.activeItem, undefined, this.activeListItem?.value === this.activeItem ? this.activeListItem : undefined);
  }

  private selectItem(item: unknown, event?: MouseEvent, source?: UiListItem): void {
    this.activateItem(item, source);
    if (this.multiple) {
      this.selectMultiple(item, event);
    } else {
      this.selected = item;
      this.selectionAnchor = item;
    }
    this.syncListItemSelection();
    this.emitSelection(item);
  }

  /**
   * Multi-selection semantics matching the legacy MDC SelectionHandler:
   * - plain click selects only the clicked item (clears any previous selection), unless toggleSelection is enabled;
   * - shift+click selects the range between the anchor and the clicked item;
   * - ctrl/cmd+click toggles the clicked item in/out of the selection.
   */
  private selectMultiple(item: unknown, event?: MouseEvent): void {
    const items = this.getEffectiveItems();

    if (event?.shiftKey) {
      const anchor = this.selectionAnchor ?? (Array.isArray(this.selected) ? this.selected[0] : undefined);
      const anchorIndex = anchor !== undefined ? items.indexOf(anchor) : 0;
      const index = items.indexOf(item);
      const range: unknown[] = [];
      for (let i = Math.min(anchorIndex, index); i <= Math.max(anchorIndex, index); i++) {
        if (!this.isItemDisabled(items[i])) {
          range.push(items[i]);
        }
      }
      this.selected = range;
    } else if (this.toggleSelection || (event && (event.ctrlKey || event.metaKey))) {
      const selected = Array.isArray(this.selected) ? [...this.selected] : [];
      const index = selected.indexOf(item);
      if (index >= 0) {
        selected.splice(index, 1);
      } else {
        selected.push(item);
      }
      this.selected = selected;
      this.selectionAnchor = item;
    } else {
      this.selected = [item];
      this.selectionAnchor = item;
    }
  }

  private emitActivate(item: unknown): void {
    this.host.dispatchEvent(new CustomEvent('list-activate', {
      bubbles: true,
      detail: item
    }));
  }

  private emitSelection(item: unknown): void {
    this.host.dispatchEvent(new CustomEvent('list-select', {
      bubbles: true,
      detail: item
    }));
  }

  private resolveElementFromEvent(target: EventTarget | null) {
    return target instanceof HTMLElement ? target.closest(LIST_ITEM_SELECTOR) : null;
  }

  private isTypeaheadKey(event: KeyboardEvent): boolean {
    return (event.key.length === 1 || event.key === ' ') && !event.altKey && !event.ctrlKey && !event.metaKey;
  }

  private handleTypeahead(character: string): void {
    this.typeaheadBuffer += character;
    this.clearTypeahead();
    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer = '';
      this.typeaheadTimer = undefined;
    }, 800);

    const items = this.getEffectiveItems();
    const startIndex = this.activeItem !== undefined ? items.indexOf(this.activeItem) : 0;

    for (let step = 0; step < items.length; step++) {
      const index = (startIndex + step) % items.length;
      const item = items[index];
      const label = this.getItemText(item).toLowerCase();
      if (label.startsWith(this.typeaheadBuffer) && !this.isItemDisabled(item)) {
        this.scrollItemIntoView(item);
        this.activateItem(item);
        return;
      }
    }
  }

  private getItemText(item: unknown): string {
    if (this.typeaheadField && item && typeof item === 'object') {
      const value = (item as Record<string, unknown>)[this.typeaheadField];
      return value === undefined || value === null ? '' : String(value);
    }

    return item === undefined || item === null ? '' : String(item);
  }

  private clearTypeahead(): void {
    if (this.typeaheadTimer) {
      clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = undefined;
    }
  }

  // #region IReorderHost (the ui-reorder attribute drives these; it never moves DOM itself)

  get reorderContainer(): HTMLElement {
    return this.scrollerEl ?? this.host;
  }

  get reorderOrientation(): 'vertical' | 'horizontal' {
    return this.orientation;
  }

  resolveSlot(target: EventTarget | null): Element | null {
    return this.resolveElementFromEvent(target);
  }

  slots(): readonly Element[] {
    return this.listItemElements;
  }

  indexOf(slot: Element): number {
    // An explicit list-item `index` is the virtual-repeat contract (dataset index of a
    // windowed row); plain lists fall back to DOM position.
    const listItem = CustomElement.for<UiListItem>(slot).viewModel;
    if (listItem.index !== undefined) {
      return Number(listItem.index);
    }
    const index = this.getEffectiveItems().indexOf(listItem.value);
    return index >= 0 ? index : this.listItemElements.indexOf(slot as HTMLElement);
  }

  itemAt(index: number): unknown {
    return this.getEffectiveItems()[index];
  }

  selectedIndexes(): number[] {
    const items = this.getEffectiveItems();
    const selection = Array.isArray(this.selected) ? this.selected : this.selected !== undefined ? [this.selected] : [];
    return selection.map(value => items.indexOf(value)).filter(index => index >= 0);
  }

  canReorder(slot: Element): boolean {
    const listItem = CustomElement.for<UiListItem>(slot).viewModel;
    return !listItem.disabled;
  }

  // #endregion

  scrollItemIntoView(item: unknown, behavior: ScrollBehavior = 'smooth'): void {
    const listItem = this.listItems.find(x => x.value === item);
    this.suppressMouseOver = true;

    if (listItem) {
      listItem.element.scrollIntoView({ behavior, block: 'start', inline: 'nearest' });
    } else {
      const items = this.getEffectiveItems();
      const index = items.indexOf(item);
      if (index < 0 || items.length === 0) {
        return;
      }

      const scroller = this.scrollerEl ?? this.host;
      const itemHeight = this.listItems[0]?.element.getBoundingClientRect().height || scroller.scrollHeight / items.length;
      scroller.scrollTo({ top: itemHeight * index });
      scroller.dispatchEvent(new Event('scroll'));
      this.listItemsChangedCallback = () => this.scrollItemIntoView(item);
    }
  }
}
