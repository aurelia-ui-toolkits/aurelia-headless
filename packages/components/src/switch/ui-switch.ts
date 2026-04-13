import { bindable, BindingMode, customElement } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import template from './ui-switch.html?raw';

@customElement({ name: 'ui-switch', template })
export class UiSwitch {
  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  checked: boolean = false;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  hover: boolean = false;
  focus: boolean = false;
  active: boolean = false;
  changing: boolean = false;

  private changingFrame: number | null = null;

  onClick(): void {
    this.toggle();
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
      this.toggle();
      return;
    }

    if (event.key === 'Enter') {
      this.submitClosestForm(event.currentTarget);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
    }
  }

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

  detaching(): void {
    if (this.changingFrame !== null) {
      cancelAnimationFrame(this.changingFrame);
      this.changingFrame = null;
    }
  }

  private toggle(): void {
    if (this.disabled) {
      return;
    }

    this.changing = true;
    this.checked = !this.checked;

    if (this.changingFrame !== null) {
      cancelAnimationFrame(this.changingFrame);
    }

    this.changingFrame = requestAnimationFrame(() => {
      this.changing = false;
      this.changingFrame = null;
    });
  }

  private submitClosestForm(target: EventTarget | null): void {
    const element = target instanceof HTMLElement ? target : null;
    const form = element?.closest('form');

    if (!form || this.disabled) {
      return;
    }

    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
      return;
    }

    form.submit();
  }
}
