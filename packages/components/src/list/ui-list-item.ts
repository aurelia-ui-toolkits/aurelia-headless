import { bindable, customElement, INode, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import template from './ui-list-item.html?raw';
import { UiList } from './ui-list';

@customElement({ name: 'ui-list-item', template })
export class UiListItem {
  readonly element = resolve(INode) as HTMLElement;
  readonly parentList = resolve(UiList);

  @slotted({ slotName: 'leading' })
  leadingNodes: readonly Node[] = [];

  @slotted({ slotName: 'secondary' })
  secondaryNodes: readonly Node[] = [];

  @slotted({ slotName: 'trailing' })
  trailingNodes: readonly Node[] = [];

  get hasSecondary(): boolean {
    return this.secondaryNodes.length > 0;
  }

  @bindable
  value: object = this;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable({ set: booleanAttr })
  nonSelectable: boolean = false;
}
