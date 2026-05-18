import { AlertModal } from './alert-modal/alert-modal';
import { PromptDialog } from './prompt-dialog/prompt-dialog';

export class AlertConfiguration {
  defaultAlertModal: new (...args: never[]) => object = AlertModal;
  defaultPromptDialog: new (...args: never[]) => object = PromptDialog;
  okText: string = 'Ok';
  cancelText: string = 'Cancel';
  yesText: string = 'Yes';
  noText: string = 'No';
}
