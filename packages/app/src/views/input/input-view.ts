import { customElement } from 'aurelia';
import { IError } from 'aurelia-headless';
import template from './input-view.html?raw';

@customElement({ name: 'input-view', template })
export class InputView {
  basicValue = '';
  searchValue = 'Project Aurora';
  emailValue = '';

  emailErrors = new Map<IError, boolean>();

  private readonly requiredError: IError = { message: 'Email is required.' };
  private readonly formatError: IError = { message: 'Please enter a valid email address.' };

  onEmailInput(): void {
    if (!this.emailValue.trim()) {
      this.emailErrors.set(this.requiredError, true);
      this.emailErrors.delete(this.formatError);
      return;
    }

    this.emailErrors.delete(this.requiredError);

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.emailValue)) {
      this.emailErrors.delete(this.formatError);
      return;
    }

    this.emailErrors.set(this.formatError, true);
  }

  clearSearch(): void {
    this.searchValue = '';
  }
}
