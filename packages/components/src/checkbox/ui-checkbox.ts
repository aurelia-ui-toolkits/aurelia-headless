import { bindable, BindingMode, CustomElement, customElement, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import { IError, IValidatedElement } from '../base/i-validated-element';
import template from './ui-checkbox.html?raw';

let nextCheckboxId = 0;

@customElement({ name: 'ui-checkbox', template })
export class UiCheckbox {
  constructor() {
    defineUiCheckboxElementApis(resolve(Element) as HTMLElement);
  }

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  checked: boolean = false;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  indeterminate: boolean = false;

  @bindable({ set: booleanAttr })
  invalid: boolean = false;

  @bindable
  id: string = `ui-checkbox-${++nextCheckboxId}`;

  @bindable
  label: string | undefined;

  @bindable
  helperText: string | undefined;

  @bindable
  tabIndex: number = 0;

  @slotted({ slotName: 'helper' })
  helperNodes: readonly Node[] = [];

  @slotted()
  labelNodes: readonly Node[] = [];

  errors = new Map<IError, boolean>();
  hover: boolean = false;
  focus: boolean = false;
  active: boolean = false;
  changing: boolean = false;

  controlEl!: HTMLInputElement;

  private changingFrame: number | undefined;

  get hasLabel(): boolean {
    return !!this.label || this.labelNodes.length > 0;
  }

  get hasField(): boolean {
    return this.hasLabel || !!this.helperText || this.helperNodes.length > 0 || this.errors.size > 0;
  }

  get hasSubscript(): boolean {
    return this.hasField;
  }

  get labelId(): string {
    return `${this.id}-label`;
  }

  get helperId(): string {
    return `${this.id}-helper`;
  }

  get errorsId(): string {
    return `${this.id}-errors`;
  }

  addError(error: IError): void {
    if (this.findError(error)) {
      return;
    }

    this.errors.set(error, true);
  }

  removeError(error: IError): void {
    const existing = this.findError(error);
    if (existing) {
      this.errors.delete(existing);
      return;
    }

    this.errors.delete(error);
  }

  private findError(error: IError): IError | undefined {
    for (const existing of this.errors.keys()) {
      if (existing === error || existing.message === error.message) {
        return existing;
      }
    }

    return undefined;
  }

  onClick(event: MouseEvent): void {
    if (event.target instanceof HTMLInputElement) {
      return;
    }

    event.preventDefault();
    this.toggle();
  }

  onInputClick(): void {
  }

  onInputChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement) || this.disabled) {
      return;
    }

    this.changing = true;
    this.checked = event.target.checked;
    this.indeterminate = false;

    if (this.changingFrame) {
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
    if (this.changingFrame) {
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

    this.dispatchValueEvent('input');
    this.dispatchValueEvent('change');

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

  private syncControlIndeterminate(): void {
    if (this.controlEl) {
      this.controlEl.indeterminate = this.indeterminate;
    }
  }

  private dispatchValueEvent(type: 'input' | 'change'): void {
    this.controlEl.checked = this.checked;
    this.controlEl.indeterminate = this.indeterminate;
    this.controlEl.dispatchEvent(new Event(type, { bubbles: true }));
  }
}

export interface IUiCheckboxElement extends IValidatedElement {
  checked: boolean;
  disabled: boolean;
}

function defineUiCheckboxElementApis(element: HTMLElement) {
  Object.defineProperties(element, {
    tagName: {
      get() {
        return 'UI-CHECKBOX';
      }
    },
    checked: {
      get(this: IUiCheckboxElement) {
        return CustomElement.for<UiCheckbox>(this).viewModel.checked;
      },
      set(this: IUiCheckboxElement, value: boolean) {
        CustomElement.for<UiCheckbox>(this).viewModel.checked = value;
      },
      configurable: true
    },
    disabled: {
      get(this: IUiCheckboxElement) {
        return CustomElement.for<UiCheckbox>(this).viewModel.disabled;
      },
      set(this: IUiCheckboxElement, value: boolean) {
        CustomElement.for<UiCheckbox>(this).viewModel.disabled = value;
      },
      configurable: true
    },
    addError: {
      value(this: IUiCheckboxElement, error: IError) {
        CustomElement.for<UiCheckbox>(this).viewModel.addError(error);
      },
      configurable: true
    },
    removeError: {
      value(this: IUiCheckboxElement, error: IError) {
        CustomElement.for<UiCheckbox>(this).viewModel.removeError(error);
      },
      configurable: true
    }
  });
}
