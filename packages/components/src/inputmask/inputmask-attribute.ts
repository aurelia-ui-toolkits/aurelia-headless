import Inputmask from 'inputmask';
import { OptionsStore } from './options-store';
import { BindingMode, bindable, customAttribute, resolve } from 'aurelia';

@customAttribute({ name: 'ui-inputmask', defaultProperty: 'mask' })
export class UiInputmaskCustomAttribute {
  private element = resolve(Element);
  private optionsStore = resolve(OptionsStore);

  @bindable({ mode: BindingMode.twoWay })
  value: string | undefined = '';
  ignoreChange: boolean | undefined;
  valueChanged() {
    if (!this.input) {
      return;
    }
    if (this.ignoreChange) {
      this.ignoreChange = false;
      return;
    }
    if (this.input.value !== this.value) {
      this.input.value = this.value || '';
    }
    this.element.dispatchEvent(new CustomEvent('ui-inputmask-change', { bubbles: true }));
  }

  @bindable({ mode: BindingMode.twoWay })
  incompleteValue: string | undefined;

  @bindable()
  mask: string | undefined;
  maskChanged() {
    if (this.input && this.mask) {
      this.createInstance();
      this.instance?.mask(this.input);
    }
  }

  @bindable
  isValueMasked: boolean | undefined;

  input: HTMLInputElement | null | undefined;

  instance: Inputmask.Instance | undefined;

  @bindable
  options: Record<string, unknown> | undefined;

  attaching() {
    if (this.element.tagName === 'INPUT') {
      this.input = this.element as HTMLInputElement;
    } else {
      this.input = this.element.querySelector('input');
      if (!this.input) {
        return;
      }
    }
    this.input.addEventListener('focusout', this.onInputChanged);
    this.input.addEventListener('change', this.onInputChanged);
    this.input.addEventListener('input', this.onInputChanged);
    this.createInstance();
    this.instance?.mask(this.input);
    this.input.value = this.value || '';
    this.valueChanged();
  }

  createInstance() {
    const options = { ...this.optionsStore.options, ...this.options };
    this.instance = new Inputmask(this.mask ?? '', options);
  }

  detaching() {
    if (!this.input) {
      return;
    }
    this.input.removeEventListener('focusout', this.onInputChanged);
    this.input.removeEventListener('change', this.onInputChanged);
    this.input.removeEventListener('input', this.onInputChanged);
    this.input.inputmask?.remove();
  }

  onInputChanged = () => {
    if (!this.input) {
      return;
    }
    this.incompleteValue = this.input.inputmask?.unmaskedvalue();
    const value = this.input.inputmask?.isComplete() ? (this.isValueMasked ? this.input.value : this.incompleteValue) : undefined;
    if (this.value !== value) {
      this.ignoreChange = true;
      this.value = value;
    }
  };

}
