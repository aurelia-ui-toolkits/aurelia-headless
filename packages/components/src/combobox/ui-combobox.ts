import { bindable, BindingMode, CustomElement, customElement, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { IError, IValidatedElement } from '../base/i-validated-element';
import { Keys } from '../base/keys';
import { UiMenu } from '../menu/ui-menu';
import template from './ui-combobox.html?raw';

let nextComboboxId = 0;

@customElement({ name: 'ui-combobox', template })
export class UiCombobox {
  constructor() {
    defineUiComboboxElementApis(this.element);
  }

  readonly element = resolve(Element) as HTMLElement;

  errors = new Map<IError, boolean>();
  focus: boolean = false;
  active: boolean = false;
  controlEl!: HTMLElement;
  inputEl!: HTMLInputElement;
  menu!: UiMenu;

  @bindable({ mode: BindingMode.twoWay })
  value: unknown;

  @bindable({ mode: BindingMode.twoWay })
  text: string | undefined;

  @bindable({ mode: BindingMode.twoWay })
  selectedItem: unknown;

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  open: boolean = false;

  @bindable
  label: string | undefined;

  @bindable({ set: booleanAttr })
  inset: boolean = false;

  @bindable
  helperText: string | undefined;

  @bindable
  id: string = `ui-combobox-${++nextComboboxId}`;

  @bindable
  name: string | undefined;

  @bindable
  placeholder: string | undefined;

  @bindable
  autocomplete: AutoFill | undefined;

  @bindable
  valueField: string | undefined;

  @bindable
  labelField: string | undefined;

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

  private initialText: string | undefined;
  get textValue(): string | undefined {
    if (this.inputEl) {
      return this.inputEl.value;
    }
    return this.initialText;
  }
  set textValue(value: string | undefined) {
    this.text = value;
    if (this.inputEl) {
      this.inputEl.value = value ?? '';
    } else {
      this.initialText = value;
    }
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

  get hasValue(): boolean {
    return !!this.textValue;
  }

  get placeholderText(): string | undefined {
    if (this.inset && !this.focus) {
      return undefined;
    }
    return this.placeholder;
  }

  attached(): void {
    if (this.text !== undefined) {
      this.textValue = this.text;
    }
  }

  addError(error: IError): void {
    this.errors.set(error, true);
  }

  removeError(error: IError): void {
    this.errors.delete(error);
  }

  onInput(): void {
    this.text = this.inputEl.value;
    this.selectedItem = undefined;
    this.value = undefined;
    this.open = true;
    this.dispatchValueEvent('input');
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled || this.readonly) {
      return;
    }

    if (event.key === Keys.Tab) {
      this.open = false;
      return;
    }

    if (event.key === Keys.ArrowDown || event.key === Keys.ArrowUp) {
      event.preventDefault();
      this.open = true;
      this.menu.focus();
      return;
    }

    if (event.key === Keys.Escape) {
      event.preventDefault();
      this.open = false;
    }
  }

  onMenuSelect(event: CustomEvent): void {
    this.selectedItem = event.detail;
    this.value = this.getItemValue(event.detail);
    this.textValue = this.getItemLabel(event.detail);
    this.open = false;
    this.inputEl.focus();
    this.dispatchValueEvent('input');
    this.dispatchValueEvent('change');
  }

  onMenuTabAway(): void {
    this.open = false;
    this.focus = false;
  }

  onFocusIn(): void {
    if (!this.disabled) {
      this.focus = true;
      this.open = true;
    }
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.menu.contains(next)) {
      event.stopPropagation();
      return;
    }

    this.open = false;
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

  private getItemValue(item: unknown): unknown {
    if (this.valueField && item && typeof item === 'object') {
      return (item as Record<string, unknown>)[this.valueField];
    }
    return item;
  }

  private getItemLabel(item: unknown): string {
    if (this.labelField && item && typeof item === 'object') {
      const label = (item as Record<string, unknown>)[this.labelField];
      return label === undefined || label === null ? '' : String(label);
    }
    return item === undefined || item === null ? '' : String(item);
  }

  private dispatchValueEvent(type: 'input' | 'change'): void {
    this.element.dispatchEvent(new Event(type, { bubbles: true }));
  }
}

export interface IUiComboboxElement extends IValidatedElement {
  value: unknown;
}

function defineUiComboboxElementApis(element: HTMLElement) {
  Object.defineProperties(element, {
    tagName: {
      get() {
        return 'UI-COMBOBOX';
      }
    },
    value: {
      get(this: IUiComboboxElement) {
        return CustomElement.for<UiCombobox>(this).viewModel.value;
      },
      set(this: IUiComboboxElement, value: unknown) {
        CustomElement.for<UiCombobox>(this).viewModel.value = value;
      },
      configurable: true
    },
    disabled: {
      get(this: IUiComboboxElement) {
        return CustomElement.for<UiCombobox>(this).viewModel.disabled;
      },
      set(this: IUiComboboxElement, value: boolean) {
        CustomElement.for<UiCombobox>(this).viewModel.disabled = value;
      },
      configurable: true
    },
    readOnly: {
      get(this: IUiComboboxElement) {
        return CustomElement.for<UiCombobox>(this).viewModel.readonly;
      },
      set(this: IUiComboboxElement, value: boolean) {
        CustomElement.for<UiCombobox>(this).viewModel.readonly = value;
      },
      configurable: true
    },
    addError: {
      value(this: IUiComboboxElement, error: IError) {
        CustomElement.for<UiCombobox>(this).viewModel.addError(error);
      },
      configurable: true
    },
    removeError: {
      value(this: IUiComboboxElement, error: IError) {
        CustomElement.for<UiCombobox>(this).viewModel.removeError(error);
      },
      configurable: true
    },
    focus: {
      value(this: IUiComboboxElement) {
        CustomElement.for<UiCombobox>(this).viewModel.inputEl.focus();
      },
      configurable: true
    },
    blur: {
      value(this: IUiComboboxElement) {
        CustomElement.for<UiCombobox>(this).viewModel.inputEl.blur();
      },
      configurable: true
    },
    isFocused: {
      get(this: IUiComboboxElement) {
        return document.activeElement === CustomElement.for<UiCombobox>(this).viewModel.inputEl;
      },
      configurable: true
    }
  });
}
