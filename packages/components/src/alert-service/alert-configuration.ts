import { UiAlertModal } from './alert-modal/alert-modal';
import { UiPromptDialog } from './prompt-dialog/prompt-dialog';

export class AlertConfiguration {
  defaultAlertModal: new (...args: never[]) => object = UiAlertModal;
  defaultPromptDialog: new (...args: never[]) => object = UiPromptDialog;
  okText: string = 'Ok';
  cancelText: string = 'Cancel';
  yesText: string = 'Yes';
  noText: string = 'No';
}
