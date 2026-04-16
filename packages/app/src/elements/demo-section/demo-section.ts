import { bindable, customElement } from 'aurelia';
import template from './demo-section.html?raw';

@customElement({ name: 'demo-section', template })
export class DemoSection {
  @bindable title: string = '';
}
