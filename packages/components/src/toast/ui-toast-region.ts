import { bindable, customElement, INode, resolve } from 'aurelia';
import { UiToastMessage } from './ui-toast-service';

@customElement('ui-toast-region')
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
