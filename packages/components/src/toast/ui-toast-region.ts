import { bindable, customElement, INode, resolve } from 'aurelia';
import { UiToastMessage } from './ui-toast-service';
import template from './ui-toast-region.html?raw';

@customElement({ name: 'ui-toast-region', template })
export class UiToastRegion {
  private readonly host = resolve(INode) as HTMLElement;

  @bindable
  toasts: UiToastMessage[] = [];

  close(toast: UiToastMessage): void {
    this.host.dispatchEvent(new CustomEvent('toast-close', {
      bubbles: true,
      detail: toast.id
    }));
  }
}
