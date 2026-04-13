import { customElement } from 'aurelia';
import { DemoBlock } from './elements/demo-block/demo-block';
import template from './my-app.html?raw';

@customElement({ name: 'my-app', template, dependencies: [DemoBlock] })
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
