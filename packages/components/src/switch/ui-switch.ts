import { bindable, BindingMode, customElement } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
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

  private changingFrame: number | undefined;

  onClick(): void {
    this.toggle();
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === Keys.Space) {
      event.preventDefault();
      this.toggle();
      return;
    }

    if (event.key === Keys.Enter) {
      this.submitClosestForm(event.currentTarget);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key ===  Keys.Space || event.key === Keys.Enter) {
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
    if (this.changingFrame) {
      cancelAnimationFrame(this.changingFrame);
      this.changingFrame = undefined;
    }
  }

  private toggle(): void {
    if (this.disabled) {
      return;
    }

    this.changing = true;
    this.checked = !this.checked;

    if (this.changingFrame) {
      cancelAnimationFrame(this.changingFrame);
    }

    this.changingFrame = requestAnimationFrame(() => {
      this.changing = false;
      this.changingFrame = undefined;
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
