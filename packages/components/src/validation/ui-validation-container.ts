import { bindable, CustomElement, customElement, INode, resolve } from 'aurelia';
import { IError, IValidatedElement } from '../base/i-validated-element';

@customElement('ui-validation-container')
export class UiValidationContainer {
  private readonly element = resolve(INode) as HTMLElement;

  constructor() {
    defineUiValidationContainerElementApis(this.element);
  }

  @bindable
  value: unknown;

  errors = new Map<IError, boolean>();
  errorMessages: string[] = [];
  valid: boolean = true;

  addError(error: IError): void {
    this.errors.set(error, true);
    this.valid = false;
    this.renderErrors();
  }

  removeError(error: IError): void {
    this.errors.delete(error);
    this.valid = this.errors.size === 0;
    this.renderErrors();
  }

  renderErrors(): void {
    this.errorMessages = Array.from(this.errors.keys())
      .filter(error => error.message)
      .map(error => error.message!);
  }
}

export interface IUiValidationContainerElement extends IValidatedElement {
  renderErrors(): void;
}

function defineUiValidationContainerElementApis(element: HTMLElement): void {
  Object.defineProperties(element, {
    addError: {
      value(this: IUiValidationContainerElement, error: IError): void {
        CustomElement.for<UiValidationContainer>(this).viewModel.addError(error);
      },
      configurable: true
    },
    removeError: {
      value(this: IUiValidationContainerElement, error: IError): void {
        CustomElement.for<UiValidationContainer>(this).viewModel.removeError(error);
      },
      configurable: true
    },
    renderErrors: {
      value(this: IUiValidationContainerElement): void {
        CustomElement.for<UiValidationContainer>(this).viewModel.renderErrors();
      },
      configurable: true
    }
  });
}
