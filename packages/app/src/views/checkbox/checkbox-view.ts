import { customElement } from 'aurelia';
import template from './checkbox-view.html?raw';
import './checkbox-view.css';

@customElement({ name: 'checkbox-view', template })
export class CheckboxView {
  marketingConsent = true;
  termsAccepted = false;
}
