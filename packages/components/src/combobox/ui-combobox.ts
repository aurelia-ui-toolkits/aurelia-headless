import { bindable, BindingMode, CustomElement, customElement, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { IError, IValidatedElement } from '../base/i-validated-element';
import { Keys } from '../base/keys';
import { UiFieldConfiguration } from '../field/ui-field-configuration';
import { UiMenu } from '../menu/ui-menu';
import template from './ui-combobox.html?raw';

let nextComboboxId = 0;
type ComboboxOptions = unknown[] | ((filter: string | undefined, value: unknown) => unknown[] | Promise<unknown[]>);

@customElement({ name: 'ui-combobox', template })
export class UiCombobox {
  private readonly configuration = resolve(UiFieldConfiguration);

  constructor() {
    defineUiComboboxElementApis(this.element);
  }

  readonly element = resolve(Element) as HTMLElement;
  readonly slotHost = this;

  errors = new Map<IError, boolean>();
  hover: boolean = false;
  focus: boolean = false;
  active: boolean = false;
  controlEl!: HTMLElement;
  inputEl!: HTMLInputElement;
  menu!: UiMenu;

  @bindable({ mode: BindingMode.twoWay })
  value: unknown;
  async valueChanged(): Promise<void> {
    if (this.suppressValueChanged) {
      this.suppressValueChanged = false;
      return;
    }

    await this.updateFilterBasedOnValue();
  }

  @bindable({ mode: BindingMode.twoWay })
  text: string | undefined;
  textChanged(): void {
    if (this.inputEl && this.inputEl.value !== (this.text ?? '')) {
      this.inputEl.value = this.text ?? '';
    }
  }

  @bindable
  items: ComboboxOptions = [];
  async itemsChanged(): Promise<void> {
    this.setGetOptions();
    await this.updateFilterBasedOnValue();
  }

  @bindable({ mode: BindingMode.twoWay })
  filteredItems: unknown[] = [];

  selectedOption: unknown;

  @bindable
  filterField: string | undefined;

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  open: boolean = false;

  @bindable
  label: string | undefined;

  @bindable({ set: booleanAttr })
  inset: boolean = this.configuration.defaultInset;

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
  private getOptions: ((filter: string | undefined, value: unknown) => unknown[] | Promise<unknown[]>) | undefined;
  private optionsRequest = 0;
  private suppressValueChanged = false;
  private suppressFocusOpen = false;
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

  async attached(): Promise<void> {
    this.setGetOptions();
    if (this.text !== undefined) {
      this.textValue = this.text;
    }
    await this.updateFilterBasedOnValue();
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

  async onInput(): Promise<void> {
    this.text = this.inputEl.value;
    this.selectedOption = undefined;
    this.setValue(undefined);
    this.open = true;
    await this.loadOptions(true, undefined);
    this.dispatchValueEvent('input');
  }

  async onKeyDown(event: KeyboardEvent): Promise<void> {
    if (this.disabled || this.readonly) {
      return;
    }

    if (event.key === Keys.Tab) {
      this.open = false;
      return;
    }

    if (event.ctrlKey && event.key === Keys.Space) {
      event.preventDefault();
      await this.loadOptions(true, this.value);
      return;
    }

    if (event.key === Keys.ArrowDown || event.key === Keys.ArrowUp) {
      event.preventDefault();
      await this.loadOptions(true, this.value);
      this.menu.focus(event.key === Keys.ArrowDown ? Keys.Home : Keys.End);
      return;
    }

    if (event.key === Keys.Escape) {
      event.preventDefault();
      this.open = false;
    }
  }

  onMenuSelect(event: CustomEvent): void {
    this.selectedOption = event.detail;
    this.value = this.getItemValue(event.detail);
    this.open = false;
    this.suppressFocusOpen = true;
    this.inputEl.focus();
    this.dispatchValueEvent('input');
    this.dispatchValueEvent('change');
  }

  onMenuTabAway(): void {
    this.open = false;
    this.focus = false;
  }

  async onFocusIn(): Promise<void> {
    if (this.suppressFocusOpen) {
      this.suppressFocusOpen = false;
      this.focus = true;
      return;
    }

    if (!this.disabled) {
      this.focus = true;
      await this.loadOptions(true, this.value);
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
    const labelField = this.labelField ?? this.filterField;
    if (labelField && item && typeof item === 'object') {
      const label = (item as Record<string, unknown>)[labelField];
      return label === undefined || label === null ? '' : String(label);
    }
    return item === undefined || item === null ? '' : String(item);
  }

  private setValue(value: unknown): void {
    if (this.value === value) {
      return;
    }

    this.suppressValueChanged = true;
    this.value = value;
  }

  private setGetOptions(): void {
    if (this.items instanceof Function) {
      this.getOptions = this.items;
      return;
    }

    this.getOptions = this.getOptionsDefault;
  }

  private getOptionsDefault = (filter: string | undefined, value: unknown): unknown[] => {
    const options = Array.isArray(this.items) ? this.items : [];
    if (value !== undefined) {
      const option = options.find(item => this.getItemValue(item) === value);
      return option === undefined ? [] : [option];
    }

    const text = filter?.trim().toLowerCase();
    if (!text) {
      return options;
    }

    return options.filter(item => this.getItemFilterText(item).toLowerCase().includes(text));
  };

  private async loadOptions(open: boolean, value: unknown): Promise<void> {
    if (!this.getOptions) {
      return;
    }

    const request = ++this.optionsRequest;
    const options = await this.getOptions(this.textValue, value);
    if (request !== this.optionsRequest) {
      return;
    }

    this.filteredItems = options;
    if (open) {
      this.open = true;
    }
  }

  private async updateFilterBasedOnValue(): Promise<void> {
    if (this.value !== undefined) {
      await this.loadOptions(false, this.value);
    } else {
      this.filteredItems = [];
      this.selectedOption = undefined;
      this.textValue = undefined;
    }

    if (this.filteredItems.length) {
      this.selectedOption = this.filteredItems[0];
      this.textValue = this.getItemLabel(this.filteredItems[0]);
    }
  }

  private getItemFilterText(item: unknown): string {
    if (this.filterField && item && typeof item === 'object') {
      const filterValue = (item as Record<string, unknown>)[this.filterField];
      return filterValue === undefined || filterValue === null ? '' : String(filterValue);
    }

    return this.getItemLabel(item);
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
