import { bindable, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import template from './ui-list-item.html?raw';

@customElement({ name: 'ui-list-item', template })
export class UiListItem {
  @bindable
  value: object | null = null;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  active: boolean = false;

  readonly element = resolve(INode) as HTMLElement;

  getTextValue(): string {
    return this.element.textContent?.trim() ?? '';
  }
}
