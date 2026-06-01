import { IDialogController } from '@aurelia/dialog';
import { customElement, resolve } from 'aurelia';
import template from './prompt-dialog.html?raw';

export interface IPromptDialogData {
  title?: string;
  label?: string;
  text?: string;
  required?: boolean;
  textarea?: boolean;
  okText?: string;
  cancelText?: string;
}

@customElement({ name: 'ui-prompt-modal', template })
export class UiPromptDialog {
  private readonly dialog = resolve(IDialogController);

  data: IPromptDialogData = {};
  invalid: boolean = false;

  activate(data: IPromptDialogData): void {
    this.data = data;
  }

  cancel(): Promise<unknown> {
    return this.dialog.cancel();
  }

  ok(): Promise<unknown> | void {
    this.invalid = !!this.data.required && !this.data.text?.trim();
    if (this.invalid) {
      return;
    }
    return this.dialog.ok(this.data.text ?? '');
  }
}
