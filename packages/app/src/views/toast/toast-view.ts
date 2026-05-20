import { resolve } from 'aurelia';
import { UiToastService } from '@aurelia-ui-toolkits/headless';

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
