import { customElement } from 'aurelia';
import template from './switch-view.html?raw';
import './switch-view.css';

@customElement({ name: 'switch-view', template })
export class SwitchView {
  emailNotifications = true;
  desktopAlerts = false;
}
