import { IDialogController } from '@aurelia/dialog';
import { customElement, resolve } from 'aurelia';
import template from './alert-modal.html?raw';
import { IAlertModalPayload } from './i-alert-modal-payload';

@customElement({ name: 'ui-alert-modal', template })
export class UiAlertModal {
  private readonly dialog = resolve(IDialogController);

  payload: IAlertModalPayload = {};

  activate(payload: IAlertModalPayload): void {
    this.payload = payload;
  }

  async close(action: string | undefined): Promise<unknown> {
    return this.dialog.ok(action);
  }
}
