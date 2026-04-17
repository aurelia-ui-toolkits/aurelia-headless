import { IValidatedElement } from '../base/i-validated-element';
import { ValidationEvent, ValidationResultsSubscriber } from '@aurelia/validation-html';

export class UiValidationResultPresenter implements ValidationResultsSubscriber {
  handleValidationEvent(event: ValidationEvent): void {
    for (let i = 0; i < event.removedResults.length; ++i) {
      const ri = event.removedResults[i];
      for (let j = 0; j < ri.targets.length; ++j) {
        const el = ri.targets[j] as IValidatedElement;
        if (!ri.result.valid && Object.getOwnPropertyDescriptor(el, 'removeError')) {
          el.removeError(ri.result);
        }
      }
    }

    for (let i = 0; i < event.addedResults.length; ++i) {
      const ri = event.addedResults[i];
      for (let j = 0; j < ri.targets.length; ++j) {
        const el = ri.targets[j] as IValidatedElement;
        if (!ri.result.valid && Object.getOwnPropertyDescriptor(el, 'addError')) {
          el.addError(ri.result);
        }
      }
    }
  }
}
