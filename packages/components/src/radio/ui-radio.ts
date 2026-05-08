import { bindable, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { UiRadioGroup } from './ui-radio-group';
import template from './ui-radio.html?raw';

@customElement({ name: 'ui-radio', template })
export class UiRadio {
  readonly element = resolve(INode) as HTMLElement;
  readonly parentGroup = resolve(UiRadioGroup);

  @bindable
  value: unknown = this;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  get selected(): boolean {
    return this.parentGroup.isSelected(this);
  }

  get tabIndex(): number {
    return this.parentGroup.getTabIndex(this);
  }

  onClick(): void {
    if (!this.disabled) {
      this.parentGroup.select(this.value);
    }
  }
}
