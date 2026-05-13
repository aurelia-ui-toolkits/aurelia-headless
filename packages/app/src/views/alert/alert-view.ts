import { customElement } from 'aurelia';
import template from './alert-view.html?raw';
import './alert-view.css';

@customElement({ name: 'alert-view', template })
export class AlertView {
  warningOpen = true;
}
