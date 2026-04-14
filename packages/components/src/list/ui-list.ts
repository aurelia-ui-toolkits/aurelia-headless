import { bindable, children, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import { UiListItem } from './ui-list-item';
import template from './ui-list.html?raw';

type ListOrientation = 'vertical' | 'horizontal';

type ListEventDetail = {
  index: number;
  value: object | null;
};

@customElement({ name: 'ui-list', template })
export class UiList {
  private readonly host = resolve(INode) as HTMLElement;

  @bindable
  items: object[] | null = null;
  itemsChanged(): void {
    this.syncState();
  }

  @bindable({ set: booleanAttr })
  loop: boolean = true;

  @bindable
  orientation: ListOrientation = 'vertical';

  @bindable({ set: booleanAttr })
  typeahead: boolean = true;

  @children({
    query: 'ui-list-item',
    map: (_node, viewModel) => viewModel
  })
  listItems: UiListItem[] = [];
  listItemsChanged(): void {
    this.syncState();
  }

  activeIndex: number = -1;

  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  attached(): void {
    this.syncState();
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

    if (event.key === Keys.Enter || event.key === Keys.Space) {
      event.preventDefault();
      this.selectActive();
      return;
    }

    if (this.typeahead && this.isTypeaheadKey(event)) {
      this.handleTypeahead(event.key.toLowerCase());
    }
  }

  onClick(event: MouseEvent): void {
    const item = this.getTargetItem(event.target);
    if (!item || item.disabled) {
      return;
    }

    const index = this.getItemIndex(item.value);
    if (index === -1) {
      return;
    }

    this.selectIndex(index);
  }

  onMouseOver(event: MouseEvent): void {
    const item = this.getTargetItem(event.target);
    if (!item || item.disabled) {
      return;
    }

    const index = this.getItemIndex(item.value);
    if (index !== -1) {
      this.setActiveIndex(index);
    }
  }

  private getEffectiveItems(): object[] {
    if (this.items != null) {
      return this.items;
    }

    return this.listItems.map((item) => item.value).filter((value): value is object => value !== null);
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
    const values = this.getEffectiveItems();
    if (values.length === 0) {
      return;
    }

    let index = this.activeIndex;
    if (index < 0 || index >= values.length) {
      index = direction > 0 ? -1 : values.length;
    }

    let attempts = 0;
    let cursor = index;
    while (attempts < values.length) {
      cursor += direction;
      if (this.loop) {
        cursor = (cursor + values.length) % values.length;
      }

      if (!this.loop && (cursor < 0 || cursor >= values.length)) {
        return;
      }

      if (!this.isDisabledAt(cursor)) {
        this.setActiveIndex(cursor);
        return;
      }

      attempts += 1;
    }
  }

  private setFirstActive(): void {
    const values = this.getEffectiveItems();
    for (let index = 0; index < values.length; index++) {
      if (!this.isDisabledAt(index)) {
        this.setActiveIndex(index);
        return;
      }
    }
  }

  private setLastActive(): void {
    const values = this.getEffectiveItems();
    for (let index = values.length - 1; index >= 0; index--) {
      if (!this.isDisabledAt(index)) {
        this.setActiveIndex(index);
        return;
      }
    }
  }

  private setActiveIndex(index: number): void {
    const values = this.getEffectiveItems();
    if (index < 0 || index >= values.length || this.isDisabledAt(index)) {
      return;
    }

    this.activeIndex = index;
    this.setOnlyFlag('active', index);
    this.applyRenderedState();
    this.emitActivate(index);
  }

  private selectActive(): void {
    if (this.activeIndex >= 0) {
      this.selectIndex(this.activeIndex);
    }
  }

  private selectIndex(index: number): void {
    const values = this.getEffectiveItems();
    if (index < 0 || index >= values.length || this.isDisabledAt(index)) {
      return;
    }

    this.activeIndex = index;
    this.setOnlyFlag('active', index);
    this.setOnlyFlag('selected', index);
    this.applyRenderedState();
    this.emitActivate(index);
    this.emitSelection(index);
  }

  private emitActivate(index: number): void {
    this.host.dispatchEvent(new CustomEvent<ListEventDetail>('list-activate', {
      bubbles: true,
      detail: {
        index,
        value: this.getEffectiveItems()[index] ?? null
      }
    }));
  }

  private emitSelection(index: number): void {
    this.host.dispatchEvent(new CustomEvent<ListEventDetail>('list-select', {
      bubbles: true,
      detail: {
        index,
        value: this.getEffectiveItems()[index] ?? null
      }
    }));
  }

  private syncState(): void {
    const values = this.getEffectiveItems();
    if (values.length === 0) {
      this.activeIndex = -1;
      this.applyRenderedState();
      return;
    }

    const flaggedActiveIndex = values.findIndex((value, index) => this.readFlag(value, 'active') && !this.isDisabledAt(index));
    if (flaggedActiveIndex !== -1) {
      this.activeIndex = flaggedActiveIndex;
    } else if (this.activeIndex >= values.length || this.activeIndex < -1) {
      this.activeIndex = -1;
    }

    this.applyRenderedState();
  }

  private applyRenderedState(): void {
    for (const item of this.listItems) {
      item.active = this.readFlag(item.value, 'active');
      item.selected = this.readFlag(item.value, 'selected');
    }
  }

  private setOnlyFlag(flag: 'active' | 'selected', activeIndex: number): void {
    const values = this.getEffectiveItems();
    for (let index = 0; index < values.length; index++) {
      this.writeFlag(values[index], flag, index === activeIndex);
    }
  }

  private getTargetItem(target: EventTarget | null): UiListItem | null {
    const element = target instanceof HTMLElement ? target.closest('ui-list-item') : null;
    if (!element) {
      return null;
    }

    return this.listItems.find((item) => item.element === element) ?? null;
  }

  private isDisabledAt(index: number): boolean {
    const value = this.getEffectiveItems()[index] ?? null;
    if (value === null) {
      return true;
    }

    const rendered = this.listItems.find((item) => item.value === value);
    if (rendered) {
      return rendered.disabled;
    }

    return this.readFlag(value, 'disabled');
  }

  private getItemIndex(value: object | null): number {
    if (value === null) {
      return -1;
    }

    return this.getEffectiveItems().findIndex((item) => item === value);
  }

  private readFlag(value: object | null, flag: 'active' | 'selected' | 'disabled'): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }

    return (value as Record<string, unknown>)[flag] === true;
  }

  private writeFlag(value: object | null, flag: 'active' | 'selected', state: boolean): void {
    if (!value || typeof value !== 'object') {
      return;
    }

    (value as Record<string, unknown>)[flag] = state;
  }

  private isTypeaheadKey(event: KeyboardEvent): boolean {
    return event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey;
  }

  private handleTypeahead(character: string): void {
    const values = this.getEffectiveItems();
    if (values.length === 0) {
      return;
    }

    this.typeaheadBuffer += character;
    this.clearTypeahead();
    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer = '';
      this.typeaheadTimer = null;
    }, 350);

    const startIndex = this.activeIndex < 0 ? 0 : this.activeIndex + 1;
    for (let step = 0; step < values.length; step++) {
      const index = (startIndex + step) % values.length;
      if (this.isDisabledAt(index)) {
        continue;
      }

      const label = this.getTextValueAt(index).toLowerCase();
      if (label.startsWith(this.typeaheadBuffer)) {
        this.setActiveIndex(index);
        return;
      }
    }
  }

  private getTextValueAt(index: number): string {
    const value = this.getEffectiveItems()[index] ?? null;
    if (value === null) {
      return '';
    }

    const rendered = this.listItems.find((item) => item.value === value);
    if (rendered) {
      return rendered.getTextValue();
    }

    const fromLabel = (value as Record<string, unknown>).label;
    if (typeof fromLabel === 'string') {
      return fromLabel;
    }

    return String(value);
  }

  private clearTypeahead(): void {
    if (this.typeaheadTimer !== null) {
      clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = null;
    }
  }
}
