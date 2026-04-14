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

  active: boolean = false;

  getTextValue(): string {
    return this.element.textContent?.trim() ?? '';
  }
}
