import { DialogCloseResult, IDialogService } from '@aurelia/dialog';
import { bindable, BindingMode, CustomElement, customElement, INode, queueTask, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { IError, IValidatedElement } from '../base/i-validated-element';
import { formatDate, getCanonicalFormat, parseByFormat, parseCanonical } from './date-utils';
import { UiDatepickerDialog, UiDatepickerDialogData } from './ui-datepicker-dialog';
import template from './ui-datepicker.html?raw';

let nextDatepickerId = 0;

@customElement({ name: 'ui-datepicker', template })
export class UiDatepicker {
  constructor() {
    defineUiDatepickerElementApis(this.element);
  }

  readonly element = resolve(INode) as HTMLElement;
  private readonly dialogService = resolve(IDialogService);

  errors = new Map<IError, boolean>();
  focus: boolean = false;
  active: boolean = false;
  open: boolean = false;
  inputEl!: HTMLInputElement;
  inputmaskValue: string | undefined;
  private _value: string | undefined;

  @bindable({ mode: BindingMode.twoWay })
  get value(): string {
    if (this.inputEl) {
      if (this.inputmaskValue !== '' && this.inputmaskValue !== undefined) {
        const date = parseByFormat(this.inputmaskValue, this.format);
        return date ? formatDate(date, this.getIsoFormat()) : '';
      }
      return '';
    }
    return this._value ?? '';
  }
  set value(value: string) {
    this._value = value;
    if (this.inputEl) {
      const date = parseCanonical(value, this.time);
      this.inputmaskValue = date ? formatDate(date, this.format) : '';
    }
  }

  @bindable
  label: string | undefined;

  @bindable({ set: booleanAttr })
  inset: boolean = false;

  @bindable
  helperText: string | undefined;

  @bindable
  id: string = `ui-datepicker-${++nextDatepickerId}`;

  @bindable
  name: string | undefined;

  @bindable
  placeholder: string | undefined;

  @bindable
  format: string = 'dd/MM/yyyy';

  @bindable
  inputmaskFormat: string = 'dd/mm/yyyy';

  @bindable
  dialogFormat: string | undefined;

  @bindable({ set: booleanAttr })
  time: boolean = false;

  @bindable
  minuteStep: number = 1;

  @bindable
  min: string | undefined;

  @bindable
  max: string | undefined;

  @bindable
  disableFunction: ((date: Date) => boolean) | undefined;

  @bindable({ set: booleanAttr })
  disableWeekends: boolean = false;

  @bindable
  firstDay: number | undefined;

  @bindable
  yearRange: { min?: number; max?: number } | undefined;

  @bindable({ set: booleanAttr })
  showAll: boolean = false;

  @bindable
  i18n: UiDatepickerDialogData['i18n'];

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
    return !!this.inputEl?.value;
  }

  get placeholderText(): string | undefined {
    return this.placeholder ?? this.format;
  }

  attached(): void {
    if (this.inputEl !== undefined) {
      this.value = this._value ?? '';
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

  onFocusIn(): void {
    if (!this.disabled) {
      this.focus = true;
    }
  }

  handleBlur(event: Event): void {
    this.focus = false;
    event.stopPropagation();
    this.element.dispatchEvent(new CustomEvent('blur', { bubbles: true }));
  }

  handleChange(event: Event): void {
    event.stopPropagation();
    queueTask(() => this.element.dispatchEvent(new CustomEvent('change', { bubbles: true })));
  }

  handleInput(event: Event): void {
    event.stopPropagation();
    queueTask(() => this.element.dispatchEvent(new CustomEvent('input', { bubbles: true })));
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

  async openDialog(): Promise<void> {
    if (this.disabled || this.readonly) {
      return;
    }
    this.open = true;
    const result = await this.dialogService.open({
      component: () => UiDatepickerDialog,
      model: {
        value: this.value,
        label: this.label,
        dialogFormat: this.dialogFormat,
        time: this.time,
        minuteStep: this.minuteStep,
        min: this.min,
        max: this.max,
        disableFunction: this.disableFunction,
        disableWeekends: this.disableWeekends,
        firstDay: this.firstDay,
        yearRange: this.yearRange,
        showAll: this.showAll,
        i18n: this.i18n
      } satisfies UiDatepickerDialogData,
      rejectOnCancel: false,
      options: { modal: true, closedby: 'closerequest' }
    }).whenClosed() as DialogCloseResult;
    this.open = false;
    if (result.status === 'ok' && typeof result.value === 'string') {
      this.value = result.value;
      this.element.dispatchEvent(new CustomEvent('change', { bubbles: true }));
    }
    this.inputEl.focus();
  }

  getIsoFormat(): string {
    return getCanonicalFormat(this.time);
  }

  getDateValue(): Date | undefined {
    const value = this.value;
    return value !== '' ? parseCanonical(value, this.time) : undefined;
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

export interface IUiDatepickerElement extends IValidatedElement {
  value: string;
}

function defineUiDatepickerElementApis(element: HTMLElement) {
  Object.defineProperties(element, {
    tagName: {
      get() {
        return 'UI-DATEPICKER';
      }
    },
    value: {
      get(this: IUiDatepickerElement) {
        return CustomElement.for<UiDatepicker>(this).viewModel.value;
      },
      set(this: IUiDatepickerElement, value: string) {
        CustomElement.for<UiDatepicker>(this).viewModel.value = value;
      },
      configurable: true
    },
    disabled: {
      get(this: IUiDatepickerElement) {
        return CustomElement.for<UiDatepicker>(this).viewModel.disabled;
      },
      set(this: IUiDatepickerElement, value: boolean) {
        CustomElement.for<UiDatepicker>(this).viewModel.disabled = value;
      },
      configurable: true
    },
    readOnly: {
      get(this: IUiDatepickerElement) {
        return CustomElement.for<UiDatepicker>(this).viewModel.readonly;
      },
      set(this: IUiDatepickerElement, value: boolean) {
        CustomElement.for<UiDatepicker>(this).viewModel.readonly = value;
      },
      configurable: true
    },
    addError: {
      value(this: IUiDatepickerElement, error: IError) {
        CustomElement.for<UiDatepicker>(this).viewModel.addError(error);
      },
      configurable: true
    },
    removeError: {
      value(this: IUiDatepickerElement, error: IError) {
        CustomElement.for<UiDatepicker>(this).viewModel.removeError(error);
      },
      configurable: true
    },
    focus: {
      value(this: IUiDatepickerElement) {
        CustomElement.for<UiDatepicker>(this).viewModel.inputEl.focus();
      },
      configurable: true
    },
    blur: {
      value(this: IUiDatepickerElement) {
        CustomElement.for<UiDatepicker>(this).viewModel.inputEl.blur();
      },
      configurable: true
    },
    isFocused: {
      get(this: IUiDatepickerElement) {
        return document.activeElement === CustomElement.for<UiDatepicker>(this).viewModel.inputEl;
      },
      configurable: true
    }
  });
}
