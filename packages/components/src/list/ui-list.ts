import { bindable, CustomElement, customElement, INode, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import { UiListItem } from './ui-list-item';
import template from './ui-list.html?raw';

type ListOrientation = 'vertical' | 'horizontal';

@customElement({ name: 'ui-list', template })
export class UiList {
  private readonly host = resolve(INode) as HTMLElement;
  private scrollerEl!: HTMLElement;
  private listItems: UiListItem[] = [];
  private listItemsChangedCallback: (() => void) | undefined;
  activeItem: unknown;
  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  @bindable
  items: any[] = [];

  @bindable({ set: booleanAttr })
  loop: boolean = true;

  @bindable
  orientation: ListOrientation = 'vertical';

  @bindable
  typeaheadField: string | undefined;

  @bindable
  disabledField: string | ((item: unknown) => boolean) = 'disabled';

  @bindable({ mode: 'twoWay' })
  selected: unknown;

  @slotted('ui-list-item')
  listItemElements: HTMLElement[] = [];
  listItemElementsChanged() {
    this.listItems = this.listItemElements.map(element => CustomElement.for<UiListItem>(element).viewModel);
    if (!this.items.length) {
      this.items = this.listItems.map(x => x.value);
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
    const values = this.getEffectiveItems();
    if (values.length === 0) {
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

    if (this.typeaheadField && this.isTypeaheadKey(event)) {
      event.preventDefault();
      this.handleTypeahead(event.key.toLowerCase());
    }
  }

  isItemDisabled(item: unknown): boolean {
    const listItem = this.listItems.find(x => x.value === item);
    if (listItem) {
      return listItem.disabled;
    }

    if (typeof this.disabledField === 'string') {
      return !!(item as any)[this.disabledField];
    } else if (typeof this.disabledField === 'function') {
      return this.disabledField(item);
    }

    return false;
  }

  onClick(event: MouseEvent): void {
    const element = this.resolveElementFromEvent(event.target);
    if (!element) {
      return;
    }
    const listItem = CustomElement.for<UiListItem>(element).viewModel;
    if (listItem.disabled || listItem.nonSelectable) {
      return;
    }

    this.selectItem(listItem.value);
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

    this.activateItem(listItem.value);
  }

  onMouseLeave(): void {
    this.activeItem = undefined;
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
    if (this.items?.length) {
      return this.items;
    }

    return this.listItems.map(item => item.value);
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
    const currentIndex = this.activeItem ? items.indexOf(this.activeItem) : -1;
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
    if (this.selected === undefined) {
      return;
    }

    this.scrollItemIntoView(this.selected, 'instant');
    this.activateItem(this.selected);
  }

  private activateItem(item: unknown): void {
    this.activeItem = item;
    this.emitActivate(item);
  }

  private selectActive(): void {
    if (this.activeItem !== undefined) {
      const listItem = this.listItems.find(x => x.value === this.activeItem);
      if (listItem && (listItem.disabled || listItem.nonSelectable)) {
        return;
      }
      this.selectItem(this.activeItem);
    }
  }

  private selectItem(item: unknown): void {
    this.activateItem(item);
    this.selected = item;
    this.emitSelection(item);
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
    return target instanceof HTMLElement ? target.closest('ui-list-item') : null;
  }

  private resolveItemFromEvent(target: EventTarget | null) {
    const element = this.resolveElementFromEvent(target);
    if (!element) {
      return undefined;
    }

    return this.listItems.find((item) => item.element === element)?.value;
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
    const startIndex = this.activeItem ? items.indexOf(this.activeItem) : 0;

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

  scrollItemIntoView(item: unknown, behavior: ScrollBehavior = 'smooth'): void {
    const listItem = this.listItems.find(x => x.value === item);
    this.suppressMouseOver = true;

    if (listItem) {
      listItem.element.scrollIntoView({ behavior, block: 'start', inline: 'nearest' });
    } else {
      const items = this.getEffectiveItems();
      const index = items.indexOf(item);
      const scroller = this.scrollerEl ?? this.host;
      scroller.scrollTo({ top: scroller.scrollHeight / items.length * index });
      // this is a workaround to ensure the active item is scrolled into view after the items are rendered,
      // if CSS defines a gap between items the virtual-repeat spacer height might be incorrect
      // so we need to adjust the scroll after the list item gets rendered
      this.listItemsChangedCallback = () => this.scrollItemIntoView(item);
    }
  }
}
