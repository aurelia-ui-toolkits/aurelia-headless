import { bindable, customElement } from 'aurelia';
import template from './demo-block.html?raw';

@customElement({ name: 'demo-block', template })
export class DemoBlock {
  @bindable title: string = '';
}
