import { bindable, CustomElement, customElement, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import template from './ui-input.html?raw';
import { IValidatedElement } from '../base/i-validated-element';

let nextInputId = 0;

export interface IError {
  message: string | undefined;
}

@customElement({ name: 'ui-input', template })
export class UiInput {
  constructor() {
    defineUiInputElementApis(resolve(Element) as HTMLElement);
  }

  @bindable
  label: string | undefined;

  @bindable({ set: booleanAttr })
  inset: boolean = false;

  @bindable
  helperText: string | undefined;

  @bindable
  id: string = `ui-input-${++nextInputId}`;

  @bindable
  type: string = 'text';

  @bindable
  name: string | undefined;

  @bindable
  placeholder: string | undefined;

  @bindable
  autocomplete: AutoFill | undefined;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable({ set: booleanAttr })
  readonly: boolean = false;

  @bindable({ set: booleanAttr })
  required: boolean = false;

  @bindable({ set: booleanAttr })
  invalid: boolean = false;

  @bindable
  errors = new Map<IError, boolean>();

  @slotted({ slotName: 'helper' })
  helperNodes: readonly Node[] = [];

  @slotted({ slotName: 'leading' })
  leadingNodes: readonly Node[] = [];

  @slotted({ slotName: 'trailing' })
  trailingNodes: readonly Node[] = [];

  private initialValue: string | undefined;
  get value(): string | undefined {
    if (this.inputEl) {
      return this.inputEl.value;
    } else {
      return this.initialValue;
    }
  }
  set value(value: string) {
    if (this.inputEl) {
      this.inputEl.value = value;
    } else {
      this.initialValue = value;
    }
  }


  focus: boolean = false;
  active: boolean = false;
  hasValue: boolean = false;

  inputEl!: HTMLInputElement;

  get labelId(): string {
    return `${this.id}-label`;
  }

  get helperId(): string {
    return `${this.id}-helper`;
  }

  get errorsId(): string {
    return `${this.id}-errors`;
  }

  attached() {
    if (this.initialValue !== undefined) {
      this.value = this.initialValue;
    }
  }

  addError(error: IError): void {
    this.errors.set(error, true);
  }

  removeError(error: IError): void {
    this.errors.delete(error);
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
}

export interface IUiInputElement extends IValidatedElement {
  value: string;
}

function defineUiInputElementApis(element: HTMLElement) {
  Object.defineProperties(element, {
    tagName: {
      get() {
        return 'UI-INPUT';
      }
    },
    value: {
      get(this: IUiInputElement) {
        return CustomElement.for<UiInput>(this).viewModel.value;
      },
      set(this: IUiInputElement, value: string) {
        CustomElement.for<UiInput>(this).viewModel.value = value;
      },
      configurable: true
    },
    disabled: {
      get(this: IUiInputElement) {
        return CustomElement.for<UiInput>(this).viewModel.disabled;
      },
      set(this: IUiInputElement, value: boolean) {
        CustomElement.for<UiInput>(this).viewModel.disabled = value;
      },
      configurable: true
    },
    readOnly: {
      get(this: IUiInputElement) {
        return CustomElement.for<UiInput>(this).viewModel.readonly;
      },
      set(this: IUiInputElement, value: boolean) {
        CustomElement.for<UiInput>(this).viewModel.readonly = value;
      },
      configurable: true
    },
    addError: {
      value(this: IUiInputElement, error: IError) {
        CustomElement.for<UiInput>(this).viewModel.addError(error);
      },
      configurable: true
    },
    removeError: {
      value(this: IUiInputElement, error: IError) {
        CustomElement.for<UiInput>(this).viewModel.removeError(error);
      },
      configurable: true
    },
    focus: {
      value(this: IUiInputElement) {
        CustomElement.for<UiInput>(this).viewModel.inputEl.focus();
      },
      configurable: true
    },
    blur: {
      value(this: IUiInputElement) {
        CustomElement.for<UiInput>(this).viewModel.inputEl.blur();
      },
      configurable: true
    },
    isFocused: {
      get(this: IUiInputElement) {
        return document.activeElement === CustomElement.for<UiInput>(this).viewModel.inputEl;
      },
      configurable: true
    }
  });
}
