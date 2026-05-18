import { DialogCloseResult, IDialogService } from '@aurelia/dialog';
import { resolve } from 'aurelia';
import { AlertConfiguration } from './alert-configuration';
import { AlertModal } from './alert-modal/alert-modal';
import { IAlertModalPayload } from './alert-modal/i-alert-modal-payload';
import { ExceptionsTracker } from './exceptions-tracker';
import { IPromptDialogData, PromptDialog } from './prompt-dialog/prompt-dialog';

export class AlertService {
  private readonly dialogService = resolve(IDialogService);
  private readonly exceptionsTracker = resolve(ExceptionsTracker);
  private readonly configuration = resolve(AlertConfiguration);
  private progressDepth: number = 0;

  showProgress(): void {
    this.progressDepth++;
    document.dispatchEvent(new CustomEvent('alert-service:progress', { detail: { busy: true } }));
  }

  hideProgress(): void {
    this.progressDepth = Math.max(0, this.progressDepth - 1);
    document.dispatchEvent(new CustomEvent('alert-service:progress', { detail: { busy: this.progressDepth > 0 } }));
  }

  async usingProgress<T, E = never>(action: () => Promise<T>, catchHandler?: (e: unknown) => Promise<E> | E): Promise<T | E> {
    try {
      this.showProgress();
      return await action();
    } catch (e) {
      if (catchHandler) {
        return await catchHandler(e);
      }
      throw e;
    } finally {
      this.hideProgress();
    }
  }

  async showModal(model: Partial<IAlertModalPayload>): Promise<string | undefined> {
    const payload: IAlertModalPayload = { ...model };
    const result = await this.dialogService.open({
      component: () => this.configuration.defaultAlertModal || AlertModal,
      model: payload,
      rejectOnCancel: false,
      options: { modal: true, closedby: 'closerequest' }
    }).whenClosed() as DialogCloseResult;
    return typeof result.value === 'string' ? result.value : undefined;
  }

  async alert(message: string | Partial<IAlertModalPayload>): Promise<boolean> {
    const payload = typeof message === 'string' ? { message } : message;
    const model: IAlertModalPayload = {
      icon: 'i',
      tone: 'info',
      button2Text: this.configuration.okText,
      button2Action: 'ok',
      defaultAction: 'ok',
      successAction: 'ok',
      ...payload
    };
    return await this.showModal(model) === model.successAction;
  }

  async confirm(message: string | Partial<IAlertModalPayload>): Promise<boolean> {
    const payload = typeof message === 'string' ? { message } : message;
    const model: IAlertModalPayload = payload.defensive
      ? {
        icon: '?',
        tone: 'warning',
        button1Text: this.configuration.yesText,
        button1Action: 'yes',
        button2Text: this.configuration.noText,
        button2Action: 'no',
        defaultAction: 'no',
        successAction: 'yes',
        ...payload
      }
      : {
        icon: '?',
        tone: 'info',
        button1Text: this.configuration.noText,
        button1Action: 'no',
        button2Text: this.configuration.yesText,
        button2Action: 'yes',
        defaultAction: 'yes',
        successAction: 'yes',
        ...payload
      };
    return await this.showModal(model) === model.successAction;
  }

  async prompt(data: Partial<IPromptDialogData>): Promise<boolean> {
    data.okText ??= this.configuration.okText;
    data.cancelText ??= this.configuration.cancelText;
    const result = await this.dialogService.open({
      component: () => this.configuration.defaultPromptDialog || PromptDialog,
      model: data,
      rejectOnCancel: false,
      options: { modal: true, closedby: 'closerequest' }
    }).whenClosed() as DialogCloseResult;
    if (result.status === 'ok' && typeof result.value === 'string') {
      data.text = result.value;
    }
    return result.status === 'ok';
  }

  async error(message: string | Partial<IAlertModalPayload>): Promise<boolean> {
    const payload = typeof message === 'string' ? { message } : message;
    return this.alert({ icon: '!', tone: 'danger', ...payload });
  }

  async criticalError(message: string | Partial<IAlertModalPayload>, error: Error): Promise<boolean> {
    this.exceptionsTracker.track(error);
    return this.error(message);
  }
}
