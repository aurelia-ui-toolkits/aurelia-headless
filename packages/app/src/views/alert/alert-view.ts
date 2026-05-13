import { customElement } from 'aurelia';
import template from './alert-view.html?raw';

@customElement({ name: 'alert-view', template })
export class AlertView {
  warningOpen = true;
}
