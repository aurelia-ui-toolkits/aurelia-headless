import { bindable, children, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import { UiListItem } from './ui-list-item';
import template from './ui-list.html?raw';

type ListOrientation = 'vertical' | 'horizontal';

@customElement({ name: 'ui-list', template })
export class UiList {
  private readonly host = resolve(INode) as HTMLElement;

  @bindable
  items: any[] = [];

  @bindable({ set: booleanAttr })
  loop: boolean = true;

  @bindable
  orientation: ListOrientation = 'vertical';

  @bindable
  typeaheadField: string | undefined;

  @bindable({ mode: 'twoWay' })
  selected: object | undefined;

  @children({
    query: 'ui-list-item',
    map: (_node, viewModel) => viewModel
  })
  listItems: UiListItem[] = [];
  listItemsChanged() {
    if (!this.items.length) {
      this.items = this.listItems.map(x => x.value);
    }
  }

  private activeItem: object | undefined;
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

  onClick(event: MouseEvent): void {
    const item = this.resolveItemFromEvent(event.target);
    if (!item /*|| item.disabled*/) {
      return;
    }

    this.selectItem(item);
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
    const item = this.resolveItemFromEvent(event.target);
    if (!item /*|| item.disabled*/) {
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
    const currentIndex = this.activeItem ? this.items.indexOf(this.activeItem) : -1;
    let nextIndex = currentIndex + direction;

    if (this.loop) {
      nextIndex = (nextIndex + this.items.length) % this.items.length;
    } else {
      nextIndex = Math.max(0, Math.min(this.items.length - 1, nextIndex));
    }

    const next = this.items[nextIndex];
    if (next) {
      this.scrollItemIntoView(next);
      this.activateItem(next);
    }
  }

  private async setFirstActive() {
    const firstItem = this.items[0];
    this.scrollItemIntoView(firstItem);
    this.activateItem(firstItem);
  }

  private setLastActive(): void {
    const lastItem = this.items[this.items.length - 1];
    this.scrollItemIntoView(lastItem);
    this.activateItem(lastItem);
  }

  private activateItem(item: object): void {
    this.activeItem = item;
    this.emitActivate(item);
  }

  private selectActive(): void {
    if (this.activeItem) {
      this.selectItem(this.activeItem);
    }
  }

  private selectItem(item: object): void {
    this.activateItem(item);
    this.selected = item;
    this.emitSelection(item);
  }

  private emitActivate(item: object): void {
    this.host.dispatchEvent(new CustomEvent('list-activate', {
      bubbles: true,
      detail: item
    }));
  }

  private emitSelection(item: object): void {
    this.host.dispatchEvent(new CustomEvent('list-select', {
      bubbles: true,
      detail: item
    }));
  }

  private resolveItemFromEvent(target: EventTarget | null) {
    const element = target instanceof HTMLElement ? target.closest('ui-list-item') : null;
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
      this.typeaheadTimer = null;
    }, 800);

    const startIndex = this.activeItem ? this.items.indexOf(this.activeItem) : 0;

    for (let step = 0; step < this.items.length; step++) {
      const index = (startIndex + step) % this.items.length;
      const label = this.items[index][this.typeaheadField!].toLowerCase();
      if (label.startsWith(this.typeaheadBuffer)) {
        this.scrollItemIntoView(this.items[index]);
        this.activateItem(this.items[index]);
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

  private scrollItemIntoView(item: object): void {
    const listItem = this.listItems.find(x => x.value === item);
    this.suppressMouseOver = true;

    if (listItem) {
      listItem.element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else {
      const index = this.items.indexOf(item);
      this.host.scrollTo({ top: this.host.scrollHeight * index / this.items.length });
    }
  }
}
