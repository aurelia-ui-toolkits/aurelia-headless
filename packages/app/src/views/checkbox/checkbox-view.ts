import { customElement } from 'aurelia';
import template from './checkbox-view.html?raw';

@customElement({ name: 'checkbox-view', template })
export class CheckboxView {
  marketingConsent = true;
  termsAccepted = false;
}
