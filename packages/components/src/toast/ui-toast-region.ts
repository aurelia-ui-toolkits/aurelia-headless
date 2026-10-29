import { bindable, customElement, INode, resolve } from 'aurelia';
import { UiToastMessage } from './ui-toast-service';
import { UiToastRegionConfiguration } from './ui-toast-region-configuration';

@customElement('ui-toast-region')
export class UiToastRegion {
  private readonly host = resolve(INode) as HTMLElement;
  readonly configuration = resolve(UiToastRegionConfiguration);

  @bindable
  toasts: UiToastMessage[] = [];

  close(toast: UiToastMessage): void {
    this.host.dispatchEvent(new CustomEvent('toast-close', {
      bubbles: true,
      detail: toast.id
    }));
  }

  action(toast: UiToastMessage): void {
    this.host.dispatchEvent(new CustomEvent('toast-action', {
      bubbles: true,
      detail: toast.id
    }));
  }
}
