import { DialogCloseResult, IDialogService } from '@aurelia/dialog';
import { bindable, BindingMode, CustomElement, customElement, INode, resolve, slotted } from 'aurelia';
import IMask from 'imask';
import type { Locale } from 'date-fns';
import { booleanAttr } from '../base/boolean-attr';
import { IError, IValidatedElement } from '../base/i-validated-element';
import { formatDate, getCanonicalFormat, parseByFormat, parseCanonical } from './date-utils';
import { UiDatepickerDialog, UiDatepickerDialogData } from './ui-datepicker-dialog';
import template from './ui-datepicker.html?raw';

let nextDatepickerId = 0;

type DateMask = { value: string; destroy(): void; on(event: string, callback: () => void): void };

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
  private mask: DateMask | undefined;
  private pendingValue: string | undefined;
  private syncingMask = false;

  @bindable({ mode: BindingMode.twoWay })
  value: string | undefined;
  valueChanged(): void {
    this.syncInputFromValue();
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
  format: string | undefined;
  formatChanged(): void {
    this.recreateMask();
  }

  @bindable
  inputmaskFormat: string | undefined;
  inputmaskFormatChanged(): void {
    this.recreateMask();
  }

  @bindable
  dialogFormat: string | undefined;

  @bindable({ set: booleanAttr })
  time: boolean = false;
  timeChanged(): void {
    this.recreateMask();
    this.syncInputFromValue();
  }

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
  locale: Locale | undefined;
  localeChanged(): void {
    this.syncInputFromValue();
  }

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

  get effectiveFormat(): string {
    return this.format ?? (this.time ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy');
  }

  get effectiveInputmaskFormat(): string {
    return this.inputmaskFormat ?? (this.time ? 'dd/mm/yyyy HH:MM' : 'dd/mm/yyyy');
  }

  get placeholderText(): string | undefined {
    return this.placeholder ?? this.effectiveFormat;
  }

  attached(): void {
    this.createMask();
    this.syncInputFromValue();
  }

  detaching(): void {
    this.mask?.destroy();
    this.mask = undefined;
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

  onFocusOut(): void {
    this.focus = false;
    this.commitInput('change');
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
    this.commitInput('input');
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
        i18n: { ...this.i18n, dateFnsLocale: this.locale ?? this.i18n?.dateFnsLocale }
      } satisfies UiDatepickerDialogData,
      rejectOnCancel: false,
      options: { modal: true, closedby: 'closerequest' }
    }).whenClosed() as DialogCloseResult;
    this.open = false;
    if (result.status === 'ok' && typeof result.value === 'string') {
      this.setValue(result.value, 'change');
    }
    this.inputEl.focus();
  }

  private recreateMask(): void {
    if (!this.inputEl) {
      return;
    }
    this.createMask();
    this.syncInputFromValue();
  }

  private createMask(): void {
    this.mask?.destroy();
    const mask = this.toImaskPattern(this.effectiveInputmaskFormat);
    this.mask = IMask(this.inputEl, { mask, lazy: false, placeholderChar: '_' }) as unknown as DateMask;
    this.mask.on('accept', () => this.commitInput('input'));
  }

  private commitInput(eventType: 'input' | 'change'): void {
    if (this.syncingMask) {
      return;
    }
    const display = this.inputEl.value;
    if (!display || display.includes('_')) {
      if (!display || display.replace(/[_/\-. :T]/g, '') === '') {
        this.setValue(undefined, eventType);
      }
      return;
    }
    const date = parseByFormat(display, this.effectiveFormat, this.locale);
    if (!date) {
      return;
    }
    this.setValue(formatDate(date, getCanonicalFormat(this.time)), eventType);
  }

  private setValue(value: string | undefined, eventType: 'input' | 'change'): void {
    if (this.value === value) {
      this.syncInputFromValue();
      return;
    }
    this.value = value;
    this.syncInputFromValue();
    this.element.dispatchEvent(new Event('input', { bubbles: true }));
    if (eventType === 'change') {
      this.element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  private syncInputFromValue(): void {
    if (!this.inputEl) {
      this.pendingValue = this.value;
      return;
    }
    const source = this.value ?? this.pendingValue;
    const date = parseCanonical(source, this.time);
    const display = date ? formatDate(date, this.effectiveFormat, this.locale) : '';
    if (this.inputEl.value !== display) {
      this.syncingMask = true;
      if (this.mask) {
        this.mask.value = display;
      } else {
        this.inputEl.value = display;
      }
      this.syncingMask = false;
    }
    this.pendingValue = undefined;
  }

  private toImaskPattern(inputFormat: string): string {
    return inputFormat.replace(/[dmyhHMsS]/g, '0');
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
  value: string | undefined;
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
      set(this: IUiDatepickerElement, value: string | undefined) {
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
