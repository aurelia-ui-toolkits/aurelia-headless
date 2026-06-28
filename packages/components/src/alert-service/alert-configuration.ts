import { UiAlertModal } from './alert-modal/ui-alert-modal';
import { UiPromptDialog } from './prompt-dialog/ui-prompt-dialog';

export class AlertConfiguration {
  defaultAlertModal: new (...args: never[]) => object = UiAlertModal;
  defaultPromptDialog: new (...args: never[]) => object = UiPromptDialog;
  okText: string = 'Ok';
  cancelText: string = 'Cancel';
  yesText: string = 'Yes';
  noText: string = 'No';
}
