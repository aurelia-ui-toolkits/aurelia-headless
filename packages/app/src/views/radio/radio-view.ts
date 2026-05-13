import { customElement, newInstanceForScope, resolve } from 'aurelia';
import { IValidationRules } from '@aurelia/validation';
import { IValidationController } from '@aurelia/validation-html';
import template from './radio-view.html?raw';
import './radio-view.css';

@customElement({ name: 'radio-view', template })
export class RadioView {
  plan: string | undefined;
  density = 'comfortable';

  public validationController: IValidationController = resolve(newInstanceForScope(IValidationController));

  constructor() {
    resolve(IValidationRules).on(RadioView).ensure(x => x.plan).required();
  }
}
