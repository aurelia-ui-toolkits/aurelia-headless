import { bindable, BindingMode, computed, CustomElement, customElement, IContainer, queueTask, resolve, slotted, ValueConverter } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { IError, IValidatedElement } from '../base/i-validated-element';
import { Keys } from '../base/keys';
import { UiFieldConfiguration } from '../field/ui-field-configuration';
import { UiMenu } from '../menu/ui-menu';
import template from './ui-select.html?raw';

let nextSelectId = 0;
type ResolvedLabelConverter = { toView(value: unknown): unknown };

@customElement({ name: 'ui-select', template })
export class UiSelect {
  private readonly configuration = resolve(UiFieldConfiguration);
  private readonly container = resolve(IContainer);

  constructor() {
    defineUiSelectElementApis(this.element);
  }

  readonly element = resolve(Element) as HTMLElement;
  readonly slotHost = this;

  errors = new Map<IError, boolean>();
  hover: boolean = false;
  focus: boolean = false;
  active: boolean = false;
  open: boolean = false;
  controlEl!: HTMLElement;
  menu!: UiMenu;
  private resolvedLabelConverter: ResolvedLabelConverter | undefined;

  @bindable({ mode: BindingMode.twoWay })
  value: unknown;
  valueChanged(): void {
    this.syncSelectedItemFromValue();
  }

  @bindable({ mode: BindingMode.twoWay })
  selectedItem: unknown;

  @bindable
  items: unknown[] = [];
  itemsChanged(): void {
    this.syncSelectedItemFromValue();
  }

  @bindable({ set: booleanAttr })
  multiple: boolean = false;
  multipleChanged(): void {
    this.syncSelectedItemFromValue();
  }

  @bindable
  label: string | undefined;

  @bindable({ set: booleanAttr })
  inset: boolean = this.configuration.defaultInset;

  @bindable
  helperText: string | undefined;

  @bindable
  id: string = `ui-select-${++nextSelectId}`;

  @bindable
  placeholder: string | undefined;

  @bindable
  valueField: string | undefined;

  @bindable
  labelField: string | undefined;

  @bindable
  labelConverter: string | ((value: unknown) => unknown) | undefined;
  labelConverterChanged(): void {
    this.resolveLabelConverter();
  }

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable({ set: booleanAttr })
  readonly: boolean = false;

  @bindable({ set: booleanAttr })
  required: boolean = false;

  @bindable({ set: booleanAttr })
  invalid: boolean = false;

  @bindable({ set: booleanAttr })
  autofocus: boolean = false;

  @bindable
  portalTarget: string | Element | null | undefined;

  @bindable
  portalPosition: InsertPosition = 'beforeend';

  /** When false (default) the dropdown matches the control width; when true it sizes to its content. */
  @bindable({ set: booleanAttr })
  naturalWidth: boolean = false;

  @slotted({ slotName: 'helper' })
  helperNodes: readonly Node[] = [];

  @slotted({ slotName: 'leading' })
  leadingNodes: readonly Node[] = [];

  @slotted({ slotName: 'trailing' })
  trailingNodes: readonly Node[] = [];

  attached(): void {
    this.resolveLabelConverter();
    this.syncSelectedItemFromValue();
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

  @computed({ flush: 'async' })
  get displayText(): string | undefined {
    if (this.multiple && Array.isArray(this.selectedItem)) {
      return this.selectedItem.length
        ? this.selectedItem.map(item => this.getItemLabel(item)).join('; ')
        : this.getValueDisplayText();
    }
    if (this.selectedItem !== undefined) {
      return this.getItemLabel(this.selectedItem);
    }
    const valueDisplayText = this.getValueDisplayText();
    if (valueDisplayText !== undefined) {
      return valueDisplayText;
    }
    if (!this.valueField && !this.labelField && this.value !== undefined) {
      return String(this.value);
    }

    return undefined;
  }

  @computed({ flush: 'async' })
  get placeholderText(): string | undefined {
    if (this.inset && !this.focus) {
      return undefined;
    }

    return this.placeholder;
  }

  get hasValue(): boolean {
    if (Array.isArray(this.value)) {
      return this.value.length > 0;
    }

    return this.value !== undefined && this.value !== null && this.value !== '';
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

  onClick(): void {
    if (this.disabled || this.readonly) {
      return;
    }

    this.open = !this.open;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled || this.readonly) {
      return;
    }

    if (event.key === Keys.Enter || event.key === Keys.Space || event.key === Keys.ArrowDown) {
      event.preventDefault();
      this.open = true;
      return;
    }

    if (event.key === Keys.Escape) {
      event.preventDefault();
      this.open = false;
      return;
    }

    // Printable key: open the popup and forward the keystroke to the list's typeahead.
    if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.open = true;
      const char = event.key;
      queueTask(() => {
        const list = this.menu.list;
        if (!list) {
          return;
        }
        list.typeaheadField = this.labelField;
        list.typeahead(char);
      });
    }
  }

  onMenuSelect(event: CustomEvent): void {
    if (this.multiple) {
      this.onMultipleMenuSelect(event.detail);
      return;
    }

    this.selectedItem = event.detail;
    this.value = this.getItemValue(event.detail);
    this.open = false;
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
    }
  }

  onFocusOut(event: FocusEvent): void {
    if (this.open) {
      event.stopPropagation();
      return;
    }

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

    const convertedLabel = this.getConvertedLabel(this.getItemValue(item));
    if (convertedLabel !== undefined) {
      return convertedLabel;
    }

    return item === undefined || item === null ? '' : String(item);
  }

  private getValueDisplayText(): string | undefined {
    if (!this.labelConverter) {
      return undefined;
    }

    if (this.multiple && Array.isArray(this.value)) {
      const labels = this.value.map(value => this.getConvertedLabel(value) ?? String(value));
      return labels.length ? labels.join('; ') : undefined;
    }

    return this.getConvertedLabel(this.value);
  }

  private getConvertedLabel(value: unknown): string | undefined {
    if (!this.resolvedLabelConverter || value === undefined || value === null) {
      return undefined;
    }

    const label = this.resolvedLabelConverter.toView(value);
    return label === undefined || label === null ? '' : String(label);
  }

  private resolveLabelConverter(): void {
    if (!this.labelConverter) {
      this.resolvedLabelConverter = undefined;
      return;
    }

    if(this.labelConverter instanceof Function) {
      this.resolvedLabelConverter = { toView: this.labelConverter };
      return;
    }

    try {
      this.resolvedLabelConverter = ValueConverter.get(this.container, this.labelConverter);
    } catch {
      this.resolvedLabelConverter = undefined;
    }
  }

  private syncSelectedItemFromValue(): void {
    if (!this.items?.length) {
      return;
    }

    if (this.multiple) {
      const values = Array.isArray(this.value) ? this.value : [];
      this.selectedItem = this.items.filter(item => values.includes(this.getItemValue(item)));
      return;
    }

    if (this.value === undefined || this.value === null || this.value === '') {
      this.selectedItem = undefined;
      return;
    }

    this.selectedItem = this.items.find(item => this.getItemValue(item) === this.value);
  }

  private onMultipleMenuSelect(item: unknown): void {
    let selectedItems = this.getMenuSelectedItems();

    if (!selectedItems) {
      selectedItems = Array.isArray(this.selectedItem) ? [...this.selectedItem] : [];
      const index = selectedItems.indexOf(item);
      if (index >= 0) {
        selectedItems.splice(index, 1);
      } else {
        selectedItems.push(item);
      }
    }

    this.selectedItem = selectedItems;
    this.value = selectedItems.map(selected => this.getItemValue(selected));
    this.dispatchValueEvent('input');
    this.dispatchValueEvent('change');
  }

  private getMenuSelectedItems(): unknown[] | undefined {
    const selected = this.menu.list?.selected;
    return Array.isArray(selected) ? [...selected] : undefined;
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

export interface IUiSelectElement extends IValidatedElement {
  value: unknown;
}

function defineUiSelectElementApis(element: HTMLElement) {
  Object.defineProperties(element, {
    tagName: {
      get() {
        return 'UI-SELECT';
      }
    },
    value: {
      get(this: IUiSelectElement) {
        return CustomElement.for<UiSelect>(this).viewModel.value;
      },
      set(this: IUiSelectElement, value: unknown) {
        CustomElement.for<UiSelect>(this).viewModel.value = value;
      },
      configurable: true
    },
    disabled: {
      get(this: IUiSelectElement) {
        return CustomElement.for<UiSelect>(this).viewModel.disabled;
      },
      set(this: IUiSelectElement, value: boolean) {
        CustomElement.for<UiSelect>(this).viewModel.disabled = value;
      },
      configurable: true
    },
    readOnly: {
      get(this: IUiSelectElement) {
        return CustomElement.for<UiSelect>(this).viewModel.readonly;
      },
      set(this: IUiSelectElement, value: boolean) {
        CustomElement.for<UiSelect>(this).viewModel.readonly = value;
      },
      configurable: true
    },
    addError: {
      value(this: IUiSelectElement, error: IError) {
        CustomElement.for<UiSelect>(this).viewModel.addError(error);
      },
      configurable: true
    },
    removeError: {
      value(this: IUiSelectElement, error: IError) {
        CustomElement.for<UiSelect>(this).viewModel.removeError(error);
      },
      configurable: true
    },
    focus: {
      value(this: IUiSelectElement) {
        CustomElement.for<UiSelect>(this).viewModel.controlEl.focus();
      },
      configurable: true
    },
    blur: {
      value(this: IUiSelectElement) {
        CustomElement.for<UiSelect>(this).viewModel.controlEl.blur();
      },
      configurable: true
    },
    isFocused: {
      get(this: IUiSelectElement) {
        return document.activeElement === CustomElement.for<UiSelect>(this).viewModel.controlEl;
      },
      configurable: true
    }
  });
}
