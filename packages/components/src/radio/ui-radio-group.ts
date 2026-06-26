import { bindable, BindingMode, CustomElement, customElement, INode, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { IError, IValidatedElement } from '../base/i-validated-element';
import { Keys } from '../base/keys';
import { UiRadio } from './ui-radio';

let nextRadioGroupId = 0;

@customElement('ui-radio-group')
export class UiRadioGroup {
  constructor() {
    defineUiRadioGroupElementApis(this.element);
  }

  readonly element = resolve(INode) as HTMLElement;

  errors = new Map<IError, boolean>();
  focus: boolean = false;

  @bindable({ mode: BindingMode.twoWay })
  value: unknown;

  @bindable
  label: string | undefined;

  @bindable
  helperText: string | undefined;

  @bindable
  id: string = `ui-radio-group-${++nextRadioGroupId}`;

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

  @slotted('ui-radio')
  radioElements: readonly HTMLElement[] = [];

  get radios(): UiRadio[] {
    return this.radioElements.map(element => CustomElement.for<UiRadio>(element).viewModel);
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

  select(value: unknown): void {
    if (this.disabled || this.readonly || this.value === value) {
      return;
    }

    this.value = value;
    this.dispatchValueEvent('input');
    this.dispatchValueEvent('change');
  }

  isSelected(radio: UiRadio): boolean {
    return this.value === radio.value;
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

  onRadioKeyDown(radio: UiRadio, event: KeyboardEvent): void {
    if (this.disabled || this.readonly) {
      return;
    }

    const radios = this.enabledRadios;
    if (!radios.length) {
      return;
    }

    if (event.key === Keys.Space || event.key === Keys.Enter) {
      if (!radio.disabled) {
        event.preventDefault();
        this.select(radio.value);
      }
      return;
    }

    if (event.key === Keys.Home) {
      event.preventDefault();
      this.focusRadio(radios[0]);
      return;
    }

    if (event.key === Keys.End) {
      event.preventDefault();
      this.focusRadio(radios[radios.length - 1]);
      return;
    }

    const direction = this.getNavigationDirection(event.key);
    if (!direction) {
      return;
    }

    event.preventDefault();
    const index = radios.indexOf(radio);
    this.focusRadio(radios[(index + direction + radios.length) % radios.length]);
  }

  onFocusIn(): void {
    if (!this.disabled) {
      this.focus = true;
    }
  }

  onFocusOut(): void {
    this.focus = false;
  }

  get enabledRadios(): UiRadio[] {
    return this.radios.filter(radio => !radio.disabled);
  }

  private focusRadio(radio: UiRadio): void {
    radio.element.focus();
  }

  private getNavigationDirection(key: string): 1 | -1 | undefined {
    if (key === Keys.ArrowRight || key === Keys.ArrowDown) {
      return 1;
    }

    if (key === Keys.ArrowLeft || key === Keys.ArrowUp) {
      return -1;
    }

    return undefined;
  }

  private dispatchValueEvent(type: 'input' | 'change'): void {
    this.element.dispatchEvent(new Event(type, { bubbles: true }));
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

export interface IUiRadioGroupElement extends IValidatedElement {
  value: unknown;
}

function defineUiRadioGroupElementApis(element: HTMLElement) {
  Object.defineProperties(element, {
    tagName: {
      get() {
        return 'UI-RADIO-GROUP';
      }
    },
    value: {
      get(this: IUiRadioGroupElement) {
        return CustomElement.for<UiRadioGroup>(this).viewModel.value;
      },
      set(this: IUiRadioGroupElement, value: unknown) {
        CustomElement.for<UiRadioGroup>(this).viewModel.value = value;
      },
      configurable: true
    },
    disabled: {
      get(this: IUiRadioGroupElement) {
        return CustomElement.for<UiRadioGroup>(this).viewModel.disabled;
      },
      set(this: IUiRadioGroupElement, value: boolean) {
        CustomElement.for<UiRadioGroup>(this).viewModel.disabled = value;
      },
      configurable: true
    },
    readOnly: {
      get(this: IUiRadioGroupElement) {
        return CustomElement.for<UiRadioGroup>(this).viewModel.readonly;
      },
      set(this: IUiRadioGroupElement, value: boolean) {
        CustomElement.for<UiRadioGroup>(this).viewModel.readonly = value;
      },
      configurable: true
    },
    addError: {
      value(this: IUiRadioGroupElement, error: IError) {
        CustomElement.for<UiRadioGroup>(this).viewModel.addError(error);
      },
      configurable: true
    },
    removeError: {
      value(this: IUiRadioGroupElement, error: IError) {
        CustomElement.for<UiRadioGroup>(this).viewModel.removeError(error);
      },
      configurable: true
    },
    focus: {
      value(this: IUiRadioGroupElement) {
        CustomElement.for<UiRadioGroup>(this).viewModel.enabledRadios[0]?.element.focus();
      },
      configurable: true
    },
    blur: {
      value(this: IUiRadioGroupElement) {
        const viewModel = CustomElement.for<UiRadioGroup>(this).viewModel;
        if (viewModel.radios.some(radio => radio.element === document.activeElement)) {
          (document.activeElement as HTMLElement).blur();
        }
      },
      configurable: true
    }
  });
}
