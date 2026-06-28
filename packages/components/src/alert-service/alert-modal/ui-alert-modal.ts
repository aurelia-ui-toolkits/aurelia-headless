import { IDialogController } from '@aurelia/dialog';
import { customElement, resolve } from 'aurelia';
import { IAlertModalPayload } from './i-alert-modal-payload';

@customElement('ui-alert-modal')
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
