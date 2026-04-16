import { customElement } from 'aurelia';
import template from './switch-view.html?raw';

@customElement({ name: 'switch-view', template })
export class SwitchView {
  emailNotifications = true;
  desktopAlerts = false;
}
