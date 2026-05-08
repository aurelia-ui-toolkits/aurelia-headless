import { bindable, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { UiRadioGroup } from './ui-radio-group';
import template from './ui-radio.html?raw';

@customElement({ name: 'ui-radio', template })
export class UiRadio {
  readonly element = resolve(INode) as HTMLElement;
  readonly parentGroup = resolve(UiRadioGroup);

  private readonly onHostKeyDown = (event: KeyboardEvent): void => {
    this.parentGroup.onRadioKeyDown(this, event);
  };

  @bindable
  value: unknown = this;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  get selected(): boolean {
    return this.parentGroup.isSelected(this);
  }

  get tabIndex(): number {
    return this.parentGroup.disabled || this.disabled ? -1 : 0;
  }

  onClick(): void {
    if (!this.disabled) {
      this.parentGroup.select(this.value);
    }
  }

  attaching(): void {
    this.element.addEventListener('keydown', this.onHostKeyDown);
  }

  detaching(): void {
    this.element.removeEventListener('keydown', this.onHostKeyDown);
  }

}
