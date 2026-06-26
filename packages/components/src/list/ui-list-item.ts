import { bindable, customElement, INode, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { UiList } from './ui-list';

@customElement('ui-list-item')
export class UiListItem {
  readonly element = resolve(INode) as HTMLElement;
  readonly parentList = resolve(UiList);
  readonly slotHost = this;

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
  valueChanged(): void {
    this.selected = this.parentList.isItemSelected(this.value);
  }

  selected: boolean = false;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable({ set: booleanAttr })
  nonSelectable: boolean = false;

  /** When set, the secondary slot renders above the primary slot as a small overline label. */
  @bindable({ set: booleanAttr })
  reverse: boolean = false;
}
