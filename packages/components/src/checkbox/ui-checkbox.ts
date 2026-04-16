import { bindable, BindingMode, customElement } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import template from './ui-checkbox.html?raw';

@customElement({ name: 'ui-checkbox', template })
export class UiCheckbox {
  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  checked: boolean = false;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  indeterminate: boolean = false;

  @bindable
  id: string = '';

  @bindable
  tabIndex: number = 0;

  hover: boolean = false;
  focus: boolean = false;
  active: boolean = false;
  changing: boolean = false;

  controlEl!: HTMLInputElement;

  private changingFrame: number | undefined;

  onClick(event: MouseEvent): void {
    if (event.target instanceof HTMLInputElement) {
      return;
    }

    event.preventDefault();
    this.toggle();
  }

  onInputClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onInputChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement) || this.disabled) {
      return;
    }

    this.changing = true;
    this.checked = event.target.checked;
    this.indeterminate = false;

    if (this.changingFrame !== undefined) {
      cancelAnimationFrame(this.changingFrame);
    }

    this.changingFrame = requestAnimationFrame(() => {
      this.changing = false;
      this.changingFrame = undefined;
    });
  }

  onKeyUp(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }

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
    if (event.key === Keys.Space || event.key === Keys.Enter) {
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
    if (this.changingFrame !== undefined) {
      cancelAnimationFrame(this.changingFrame);
      this.changingFrame = undefined;
    }
  }

  attached(): void {
    this.syncControlIndeterminate();
  }

  indeterminateChanged(): void {
    this.syncControlIndeterminate();
  }

  private toggle(): void {
    if (this.disabled) {
      return;
    }

    this.changing = true;
    if (this.indeterminate) {
      this.indeterminate = false;
      this.checked = true;
    } else {
      this.checked = !this.checked;
    }

    if (this.changingFrame !== undefined) {
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

  private syncControlIndeterminate(): void {
    if (this.controlEl) {
      this.controlEl.indeterminate = this.indeterminate;
    }
  }
}
