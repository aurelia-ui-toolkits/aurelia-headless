import { bindable, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import template from './ui-list-item.html?raw';

@customElement({ name: 'ui-list-item', template })
export class UiListItem {
  readonly element = resolve(INode) as HTMLElement;

  @bindable
  value: object | null = null;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable({ set: booleanAttr })
  active: boolean = false;
  activeChanged(): void {
    this.syncFlag('active', this.active);
  }

  @bindable({ set: booleanAttr })
  selected: boolean = false;
  selectedChanged(): void {
    this.syncFlag('selected', this.selected);
  }

  valueChanged(): void {
    this.syncFlag('active', this.active);
    this.syncFlag('selected', this.selected);
  }

  getTextValue(): string {
    return this.element.textContent?.trim() ?? '';
  }

  private syncFlag(flag: 'active' | 'selected', value: boolean): void {
    if (!this.value || typeof this.value !== 'object') {
      return;
    }

    (this.value as Record<string, unknown>)[flag] = value;
  }
}
