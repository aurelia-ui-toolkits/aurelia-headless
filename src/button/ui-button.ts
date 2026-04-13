import { bindable, customElement } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import template from './ui-button.html?raw';

@customElement({ name: 'ui-button', template })
export class UiButton {
  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  hover: boolean = false;
  focus: boolean = false;
  active: boolean = false;

  onMouseEnter(): void {
    if (!this.disabled) {
      this.hover = true;
    }
  }

  onMouseLeave(): void {
    this.hover = false;
  }

  onFocusIn(): void {
    if (!this.disabled) {
      this.focus = true;
    }
  }

  onFocusOut(): void {
    this.focus = false;
  }

  onPointerDown(): void {
    if (!this.disabled) {
      this.active = true;
    }
  }

  onPointerUp(): void {
    this.active = false;
  }

  onPointerLeave(): void {
    this.active = false;
  }

  onClick(event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
