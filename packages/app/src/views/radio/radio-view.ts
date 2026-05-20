import { newInstanceForScope, resolve } from 'aurelia';
import { IValidationRules } from '@aurelia/validation';
import { IValidationController } from '@aurelia/validation-html';

export class RadioView {
  plan: string | undefined;
  density = 'comfortable';

  public validationController: IValidationController = resolve(newInstanceForScope(IValidationController));

  constructor() {
    resolve(IValidationRules).on(RadioView).ensure(x => x.plan).required();
  }
}
