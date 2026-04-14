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
  @bindable
  items: object[] | null = null;

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

  activeIndex: number = -1;

  private readonly host = resolve(INode) as HTMLElement;
  private activeValue: object | null = null;
  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  attached(): void {
    this.syncActiveState();
  }

  detaching(): void {
    this.clearTypeahead();
  }

  itemsChanged(): void {
    this.syncActiveState();
  }

  listItemsChanged(): void {
    this.listItems = this.listItems.filter((item): item is UiListItem => item instanceof UiListItem);
    this.syncActiveState();
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
      this.emitSelection();
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

    this.setActiveIndex(index);
    this.emitSelection();
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
    if (index < 0 || index >= values.length) {
      return;
    }

    this.activeIndex = index;
    this.activeValue = values[index] ?? null;
    this.applyActiveStateToRenderedItems();
    this.emitActivate();
  }

  private emitActivate(): void {
    if (this.activeIndex < 0) {
      return;
    }

    this.host.dispatchEvent(new CustomEvent<ListEventDetail>('list-activate', {
      bubbles: true,
      detail: {
        index: this.activeIndex,
        value: this.activeValue
      }
    }));
  }

  private emitSelection(): void {
    if (this.activeIndex < 0) {
      return;
    }

    this.host.dispatchEvent(new CustomEvent<ListEventDetail>('list-select', {
      bubbles: true,
      detail: {
        index: this.activeIndex,
        value: this.activeValue
      }
    }));
  }

  private syncActiveState(): void {
    const values = this.getEffectiveItems();
    if (values.length === 0) {
      this.activeIndex = -1;
      this.activeValue = null;
      this.applyActiveStateToRenderedItems();
      return;
    }

    if (this.activeValue !== null) {
      const index = this.getItemIndex(this.activeValue);
      if (index !== -1) {
        this.activeIndex = index;
        this.applyActiveStateToRenderedItems();
        return;
      }
    }

    this.activeIndex = -1;
    this.activeValue = null;
    this.applyActiveStateToRenderedItems();
  }

  private applyActiveStateToRenderedItems(): void {
    for (const item of this.listItems) {
      item.active = this.activeValue !== null && item.value === this.activeValue;
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
    return rendered?.disabled ?? false;
  }

  private getItemIndex(value: object | null): number {
    if (value === null) {
      return -1;
    }

    return this.getEffectiveItems().findIndex((item) => item === value);
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

    return String(value);
  }

  private clearTypeahead(): void {
    if (this.typeaheadTimer !== null) {
      clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = null;
    }
  }
}
