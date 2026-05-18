import { bindable, BindingMode, CustomElement, customElement, INode, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { IError, IValidatedElement } from '../base/i-validated-element';
import template from './ui-slider.html?raw';

let nextSliderId = 0;

@customElement({ name: 'ui-slider', template })
export class UiSlider {
  constructor() {
    defineUiSliderElementApis(this.element);
  }

  readonly element = resolve(INode) as HTMLElement;
  errors = new Map<IError, boolean>();
  focus = false;
  active = false;
  inputEl!: HTMLInputElement;
  endInputEl!: HTMLInputElement;
  fillStyle = 'width: 0%';
  normalizedValue = 0;
  normalizedEndValue = 0;
  labelId = '';
  helperId = '';
  errorsId = '';
  endId = '';

  @bindable({ mode: BindingMode.twoWay })
  value: number = 0;
  valueChanged(): void {
    this.normalizeValues();
    this.updateFillStyle();
  }

  @bindable({ mode: BindingMode.twoWay })
  endValue: number = 100;
  endValueChanged(): void {
    this.normalizeValues();
    this.updateFillStyle();
  }

  @bindable
  min: number = 0;
  minChanged(): void {
    this.normalizeValues();
    this.updateFillStyle();
  }

  @bindable
  max: number = 100;
  maxChanged(): void {
    this.normalizeValues();
    this.updateFillStyle();
  }

  @bindable
  step: number = 1;

  @bindable({ set: booleanAttr })
  range = false;
  rangeChanged(): void {
    this.normalizeValues();
    this.updateFillStyle();
  }

  @bindable
  label: string | undefined;

  @bindable
  helperText: string | undefined;

  @bindable
  id: string = `ui-slider-${++nextSliderId}`;
  idChanged(): void {
    this.updateIds();
  }

  @bindable
  name: string | undefined;

  @bindable({ set: booleanAttr })
  disabled = false;

  @bindable({ set: booleanAttr })
  readonly = false;

  @bindable({ set: booleanAttr })
  required = false;

  @bindable({ set: booleanAttr })
  invalid = false;

  @slotted({ slotName: 'helper' })
  helperNodes: readonly Node[] = [];

  binding(): void {
    this.updateIds();
    this.normalizeValues();
    this.updateFillStyle();
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

  onInput(event: Event): void {
    if (!(event.target instanceof HTMLInputElement) || this.disabled || this.readonly) {
      return;
    }

    if (event.target === this.endInputEl) {
      this.endValue = Number(event.target.value);
    } else {
      this.value = Number(event.target.value);
    }
    this.normalizeValues();
    this.updateFillStyle();
    this.dispatchValueEvent('input');
  }

  onChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement) || this.disabled || this.readonly) {
      return;
    }

    if (event.target === this.endInputEl) {
      this.endValue = Number(event.target.value);
    } else {
      this.value = Number(event.target.value);
    }
    this.normalizeValues();
    this.updateFillStyle();
    this.dispatchValueEvent('change');
  }

  onFocusIn(): void {
    if (!this.disabled) {
      this.focus = true;
    }
  }

  onFocusOut(): void {
    this.focus = false;
  }

  onPointerDown(event: PointerEvent): void {
    if (this.readonly) {
      event.preventDefault();
      return;
    }

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

  onKeyDown(event: KeyboardEvent): void {
    if (this.readonly) {
      event.preventDefault();
    }
  }

  private normalizeValues(): void {
    const min = Number(this.min);
    const max = Number(this.max);
    const low = Number.isFinite(min) ? min : 0;
    const high = Number.isFinite(max) && max > low ? max : low + 100;
    const next = Number(this.value);
    const nextEnd = Number(this.endValue);
    this.normalizedValue = Math.max(low, Math.min(high, Number.isFinite(next) ? next : low));
    this.normalizedEndValue = Math.max(low, Math.min(high, Number.isFinite(nextEnd) ? nextEnd : high));
    if (this.range && this.normalizedValue > this.normalizedEndValue) {
      this.normalizedValue = this.normalizedEndValue;
    }
    if (!this.range) {
      this.normalizedEndValue = high;
    }
    if (this.value !== this.normalizedValue) {
      this.value = this.normalizedValue;
    }
    if (this.endValue !== this.normalizedEndValue) {
      this.endValue = this.normalizedEndValue;
    }
  }

  private updateFillStyle(): void {
    const min = Number(this.min) || 0;
    const max = Number(this.max) || 100;
    const range = Math.max(1, max - min);
    const startPercent = Math.max(0, Math.min(100, (this.normalizedValue - min) / range * 100));
    const endPercent = Math.max(0, Math.min(100, (this.normalizedEndValue - min) / range * 100));
    if (this.range) {
      this.fillStyle = `left: ${startPercent}%; width: ${Math.max(0, endPercent - startPercent)}%`;
      return;
    }

    this.fillStyle = `left: 0%; width: ${startPercent}%`;
  }

  private updateIds(): void {
    this.labelId = `${this.id}-label`;
    this.helperId = `${this.id}-helper`;
    this.errorsId = `${this.id}-errors`;
    this.endId = `${this.id}-end`;
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

export interface IUiSliderElement extends IValidatedElement {
  value: number;
  endValue: number;
}

function defineUiSliderElementApis(element: HTMLElement) {
  Object.defineProperties(element, {
    tagName: {
      get() {
        return 'UI-SLIDER';
      }
    },
    value: {
      get(this: IUiSliderElement) {
        return CustomElement.for<UiSlider>(this).viewModel.value;
      },
      set(this: IUiSliderElement, value: number) {
        CustomElement.for<UiSlider>(this).viewModel.value = Number(value);
      },
      configurable: true
    },
    disabled: {
      get(this: IUiSliderElement) {
        return CustomElement.for<UiSlider>(this).viewModel.disabled;
      },
      set(this: IUiSliderElement, value: boolean) {
        CustomElement.for<UiSlider>(this).viewModel.disabled = value;
      },
      configurable: true
    },
    endValue: {
      get(this: IUiSliderElement) {
        return CustomElement.for<UiSlider>(this).viewModel.endValue;
      },
      set(this: IUiSliderElement, value: number) {
        CustomElement.for<UiSlider>(this).viewModel.endValue = Number(value);
      },
      configurable: true
    },
    readOnly: {
      get(this: IUiSliderElement) {
        return CustomElement.for<UiSlider>(this).viewModel.readonly;
      },
      set(this: IUiSliderElement, value: boolean) {
        CustomElement.for<UiSlider>(this).viewModel.readonly = value;
      },
      configurable: true
    },
    addError: {
      value(this: IUiSliderElement, error: IError) {
        CustomElement.for<UiSlider>(this).viewModel.addError(error);
      },
      configurable: true
    },
    removeError: {
      value(this: IUiSliderElement, error: IError) {
        CustomElement.for<UiSlider>(this).viewModel.removeError(error);
      },
      configurable: true
    },
    focus: {
      value(this: IUiSliderElement) {
        CustomElement.for<UiSlider>(this).viewModel.inputEl.focus();
      },
      configurable: true
    },
    blur: {
      value(this: IUiSliderElement) {
        CustomElement.for<UiSlider>(this).viewModel.inputEl.blur();
      },
      configurable: true
    },
    isFocused: {
      get(this: IUiSliderElement) {
        return document.activeElement === CustomElement.for<UiSlider>(this).viewModel.inputEl;
      },
      configurable: true
    }
  });
}
