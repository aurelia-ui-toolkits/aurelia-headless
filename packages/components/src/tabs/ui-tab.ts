import { bindable, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { UiTabs } from './ui-tabs';

@customElement('ui-tab')
export class UiTab {
  readonly element = resolve(INode) as HTMLElement;
  readonly parentTabs = resolve(UiTabs);

  @bindable
  value: unknown = this;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  get selected(): boolean {
    return this.parentTabs.isSelected(this);
  }

  get tabIndex(): number {
    return !this.disabled && this.selected ? 0 : -1;
  }

  onClick(): void {
    if (!this.disabled) {
      this.parentTabs.select(this.value);
    }
  }
}
