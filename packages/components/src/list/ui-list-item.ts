import { bindable, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import template from './ui-list-item.html?raw';
import { UiList } from './ui-list';

@customElement({ name: 'ui-list-item', template })
export class UiListItem {
  readonly element = resolve(INode) as HTMLElement;
  readonly parentList = resolve(UiList);

  @bindable
  value: object = this;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;
}
