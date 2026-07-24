import { bindable, CustomElement, customElement, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { IValidatedElement } from '../base/i-validated-element';
import { UiFieldConfiguration } from '../field/ui-field-configuration';

let nextInputId = 0;

export interface IError {
  message: string | undefined;
}

@customElement('ui-input')
export class UiInput {
  private readonly configuration = resolve(UiFieldConfiguration);

  constructor() {
    defineUiInputElementApis(resolve(Element) as HTMLElement);
  }

  errors = new Map<IError, boolean>();
  hover: boolean = false;
  focus: boolean = false;
  active: boolean = false;
  inputEl!: HTMLInputElement | HTMLTextAreaElement;

  @bindable
  label: string | undefined;

  @bindable({ set: booleanAttr })
  textarea: boolean = false;

  @bindable
  rows: number | undefined;

  @bindable({ set: booleanAttr })
  inset: boolean = this.configuration.defaultInset;

  @bindable
  helperText: string | undefined;

  @bindable
  id: string = `ui-input-${++nextInputId}`;

  @bindable
  type: string | undefined;

  @bindable
  name: string | undefined;

  @bindable
  placeholder: string | undefined;

  @bindable
  maxlength: number | undefined;

  @bindable({ set: booleanAttr })
  autofocus: boolean = false;

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
      // Skip redundant assignments. The native input is bound value.two-way, so every
      // 'input' event writes the current value straight back here. With an inputmask
      // attached, that programmatic re-assignment makes inputmask re-process the buffer
      // and drop an unstable trailing radix (e.g. "5." -> "5"), which otherwise forces
      // the user to type the decimal separator twice before it sticks.
      if (this.inputEl.value !== value) {
        this.inputEl.value = value;
        // Programmatic writes fire no input/change event — refresh the float state.
        this.valueVersion++;
      }
    } else {
      this.initialValue = value;
    }
  }

  // Programmatic writes to the native value (element-API setter, ui-inputmask) fire no
  // input/change event, so the inputEl.value observation alone goes stale; bumping the version
  // re-evaluates this getter.
  private valueVersion = 0;

  get hasValue(): boolean {
    void this.valueVersion;
    return !!this.inputEl?.value;
  }

  onInputmaskChange(): void {
    this.valueVersion++;
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

  attached() {
    if (this.initialValue !== undefined) {
      this.value = this.initialValue;
    }
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

  private findError(error: IError): IError | undefined {
    for (const existing of this.errors.keys()) {
      if (existing === error || existing.message === error.message) {
        return existing;
      }
    }

    return undefined;
  }
}

export interface IUiInputElement extends IValidatedElement {
  value: string;
  maxLength: number | undefined;
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
    maxLength: {
      get(this: IUiInputElement) {
        return CustomElement.for<UiInput>(this).viewModel.maxlength;
      },
      set(this: IUiInputElement, value: number) {
        CustomElement.for<UiInput>(this).viewModel.maxlength = value;
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
