import { customElement, newInstanceForScope, resolve } from 'aurelia';
import { IError } from 'aurelia-headless';
import template from './input-view.html?raw';
import { IValidationController } from '@aurelia/validation-html';
import { IValidationRules } from '@aurelia/validation';

@customElement({ name: 'input-view', template })
export class InputView {
  basicValue = '';
  searchValue = 'Project Aurora';
  emailValue = '';

  emailErrors = new Map<IError, boolean>();

  public validationController: IValidationController = resolve(newInstanceForScope(IValidationController))

  constructor() {
    resolve(IValidationRules).on(InputView).ensure(x => x.emailValue).required().email();
  }

  clearSearch(): void {
    this.searchValue = '';
  }
}
