import { AlertService, IPromptDialogData } from '@aurelia-ui-toolkits/headless';
import { customElement, resolve } from 'aurelia';
import template from './alert-view.html?raw';
import './alert-view.css';

@customElement({ name: 'alert-view', template })
export class AlertView {
  private readonly alertService = resolve(AlertService);

  warningOpen = true;
  lastResult = 'No dialog opened yet.';

  async showAlert(): Promise<void> {
    await this.alertService.alert({ caption: 'Project archived', message: 'The project can be restored from settings.' });
    this.lastResult = 'Alert closed.';
  }

  async showConfirm(): Promise<void> {
    const confirmed = await this.alertService.confirm({ caption: 'Delete project?', message: 'This cannot be undone.', defensive: true });
    this.lastResult = confirmed ? 'Confirmed.' : 'Cancelled.';
  }

  async showPrompt(): Promise<void> {
    const data: IPromptDialogData = { title: 'Rename project', label: 'Project name', text: 'Launch plan', required: true };
    const ok = await this.alertService.prompt(data);
    this.lastResult = ok ? `New name: ${data.text}` : 'Prompt cancelled.';
  }
}
