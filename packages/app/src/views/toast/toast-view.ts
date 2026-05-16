import { customElement, resolve } from 'aurelia';
import { UiToastService } from '@aurelia-headless/components';
import template from './toast-view.html?raw';
import './toast-view.css';

@customElement({ name: 'toast-view', template })
export class ToastView {
  private readonly toasts = resolve(UiToastService);

  showInfo(): void {
    void this.toasts.info('Background sync started.', 'Syncing');
  }

  showSuccess(): void {
    void this.toasts.success('Project settings were saved.', 'Saved');
  }

  showWarning(): void {
    void this.toasts.warning('Storage is almost full.', 'Heads up');
  }

  showDanger(): void {
    void this.toasts.danger('Deploy failed. Check required fields.', 'Error');
  }
}
