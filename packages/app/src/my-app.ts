import { customElement } from 'aurelia';
import template from './my-app.html?raw';

@customElement({ name: 'my-app', template })
export class MyApp {
  clickCount = 0;
  isLoading = false;

  handleClick(): void {
    this.clickCount++;
  }

  toggleLoading(): void {
    this.isLoading = !this.isLoading;
  }
}
