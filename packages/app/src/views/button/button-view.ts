import { customElement } from 'aurelia';
import template from './button-view.html?raw';

@customElement({ name: 'button-view', template })
export class ButtonView {
  clickCount = 0;
  isLoading = false;

  handleClick(): void {
    this.clickCount++;
  }

  toggleLoading(): void {
    this.isLoading = !this.isLoading;
  }
}
