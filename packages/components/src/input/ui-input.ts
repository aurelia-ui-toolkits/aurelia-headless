import { bindable, BindingMode, customElement, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import template from './ui-input.html?raw';

let nextInputId = 0;

export interface IError {
  message: string | undefined;
}

@customElement({ name: 'ui-input', template })
export class UiInput {
  @bindable({ mode: BindingMode.twoWay })
  value: string = '';

  @bindable
  label: string | undefined;

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

  focus: boolean = false;
  active: boolean = false;

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

  addError(error: IError): void {
    this.errors.set(error, true);
  }

  removeError(error: IError): void {
    this.errors.delete(error);
  }

  onInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.value = event.target.value;
    }
  }

  onChange(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.value = event.target.value;
    }
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
