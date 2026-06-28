import { IDialogSettings, IDialogService } from '@aurelia/dialog';
import { Constructable, resolve } from 'aurelia';
import { AlertConfiguration } from './alert-configuration';
import { UiAlertModal } from './alert-modal/ui-alert-modal';
import { IAlertModalPayload } from './alert-modal/i-alert-modal-payload';
import { ExceptionsTracker } from './exceptions-tracker';
import { IPromptDialogData, UiPromptDialog } from './prompt-dialog/ui-prompt-dialog';
import { Subject } from 'rxjs/internal/Subject';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { merge } from 'rxjs/internal/observable/merge';
import { map } from 'rxjs/internal/operators/map';
import { scan } from 'rxjs/internal/operators/scan';

export interface IAlertDialogOptions<TModel = unknown, TComponent extends object = object> extends Omit<IDialogSettings, 'component' | 'model'> {
  viewModel?: Constructable<TComponent>;
  component?: IDialogSettings['component'];
  model?: TModel;
}

export class AlertService {
  private readonly dialogService = resolve(IDialogService);
  private readonly exceptionsTracker = resolve(ExceptionsTracker);
  private readonly configuration = resolve(AlertConfiguration);

  increment$ = new Subject<void>();
  decrement$ = new Subject<void>();
  busy$ = new BehaviorSubject<boolean>(false);
  busyAccumulator$ = merge(this.increment$.pipe(map(() => 1)), this.decrement$.pipe(map(() => -1)))
    .pipe(
      // eslint-disable-next-line no-useless-assignment
      scan((acc, v) => acc += v, 0),
      map(v => v > 0)
    ).subscribe(this.busy$);
  allowCancel$ = new Subject<boolean>();

  showProgress() {
    this.increment$.next();
  }

  hideProgress() {
    this.decrement$.next();
  }

  async usingProgress<T, E = never>(action: () => Promise<T>, catchHandler?: (e: Error & { nonCritical?: boolean }) => Promise<E> | E, allowCancel?: boolean): Promise<T | E> {
    try {
      this.allowCancel$.next(allowCancel ?? false);
      this.showProgress();
      return await action();
    } catch (e) {
      if (catchHandler) {
        return await catchHandler(e as Error);
      } else {
        throw e;
      }
    } finally {
      this.hideProgress();
    }
  }

  async open<TOptions, TModel = any, TComponent extends object = any>(options: IDialogSettings<TOptions, TModel, TComponent>): Promise<string | undefined> {
    try {
      this.hideProgress();
      return await this.openWithProgress(options);
    } finally {
      this.showProgress();
    }
  }

  async openWithProgress<TOptions, TModel = any, TComponent extends object = any>(options: IDialogSettings<TOptions, TModel, TComponent>): Promise<string | undefined> {
    const result = await (await this.dialogService.open(options)).dialog.closed;
    return typeof result.value === 'string' ? result.value : result.status;
  }

  async showModal(model: Partial<IAlertModalPayload>): Promise<string | undefined> {
    const payload: IAlertModalPayload = { ...model };
    return this.open({
      component: () => this.configuration.defaultAlertModal || UiAlertModal,
      model: payload,
      rejectOnCancel: false,
      options: { modal: true }
    });
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
    const result = await this.open({
      component: () => this.configuration.defaultPromptDialog || UiPromptDialog,
      model: data,
      rejectOnCancel: false,
      options: { modal: true }
    });
    if (result !== undefined && result !== 'cancel') {
      data.text = result;
    }
    return result !== undefined && result !== 'cancel';
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
