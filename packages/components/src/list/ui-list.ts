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

  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

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
    const item = this.resolveItemFromEvent(event.target);
    if (!item || item.disabled) {
      return;
    }

    this.selectItem(item);
  }

  onMouseOver(event: MouseEvent): void {
    const item = this.resolveItemFromEvent(event.target);
    if (!item || item.disabled) {
      return;
    }

    this.activateItem(item);
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
    const enabledItems = this.listItems.filter((item) => !item.disabled);
    if (enabledItems.length === 0) {
      return;
    }

    const current = this.listItems.find((item) => item.active && !item.disabled);
    const currentIndex = current ? enabledItems.indexOf(current) : -1;
    let nextIndex = currentIndex + direction;

    if (this.loop) {
      nextIndex = (nextIndex + enabledItems.length) % enabledItems.length;
    } else {
      nextIndex = Math.max(0, Math.min(enabledItems.length - 1, nextIndex));
    }

    const next = enabledItems[nextIndex];
    if (next) {
      this.activateItem(next);
    }
  }

  private setFirstActive(): void {
    for (const item of this.listItems) {
      if (!item.disabled) {
        this.activateItem(item);
        return;
      }
    }
  }

  private setLastActive(): void {
    for (let index = this.listItems.length - 1; index >= 0; index--) {
      if (!this.listItems[index].disabled) {
        this.activateItem(this.listItems[index]);
        return;
      }
    }
  }

  private activateItem(item: UiListItem): void {
    item.active = true;
    this.emitActivate(item);
  }

  private selectActive(): void {
    const current = this.listItems.find((item) => item.active && !item.disabled)
      ?? this.listItems.find((item) => !item.disabled);

    if (current) {
      this.selectItem(current);
    }
  }

  private selectItem(item: UiListItem): void {
    this.activateItem(item);
    item.selected = true;
    this.emitSelection(item);
  }

  private emitActivate(item: UiListItem): void {
    const detail = this.getDetail(item);
    this.host.dispatchEvent(new CustomEvent<ListEventDetail>('list-activate', {
      bubbles: true,
      detail
    }));
  }

  private emitSelection(item: UiListItem): void {
    const detail = this.getDetail(item);
    this.host.dispatchEvent(new CustomEvent<ListEventDetail>('list-select', {
      bubbles: true,
      detail
    }));
  }

  private resolveItemFromEvent(target: EventTarget | null): UiListItem | null {
    const element = target instanceof HTMLElement ? target.closest('ui-list-item') : null;
    if (!element) {
      return null;
    }

    return this.listItems.find((item) => item.element === element) ?? null;
  }

  private getDetail(item: UiListItem): ListEventDetail {
    const value = item.value;
    const values = this.getEffectiveItems();
    const index = value === null ? -1 : values.findIndex((entry) => entry === value);

    return { index, value };
  }

  private isTypeaheadKey(event: KeyboardEvent): boolean {
    return event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey;
  }

  private handleTypeahead(character: string): void {
    const enabledItems = this.listItems.filter((item) => !item.disabled);
    if (enabledItems.length === 0) {
      return;
    }

    this.typeaheadBuffer += character;
    this.clearTypeahead();
    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer = '';
      this.typeaheadTimer = null;
    }, 350);

    const current = this.listItems.find((item) => item.active && !item.disabled);
    const startIndex = current ? (enabledItems.indexOf(current) + 1) % enabledItems.length : 0;

    for (let step = 0; step < enabledItems.length; step++) {
      const index = (startIndex + step) % enabledItems.length;
      const label = enabledItems[index].getTextValue().toLowerCase();
      if (label.startsWith(this.typeaheadBuffer)) {
        this.activateItem(enabledItems[index]);
        return;
      }
    }
  }

  private clearTypeahead(): void {
    if (this.typeaheadTimer !== null) {
      clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = null;
    }
  }
}
