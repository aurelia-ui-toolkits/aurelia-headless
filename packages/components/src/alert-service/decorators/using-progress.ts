import { IAlertModalPayload } from '../alert-modal/i-alert-modal-payload';
import { AlertService } from '../alert-service';

export interface IWithAlertService {
  alertService: AlertService;
}

export function usingProgress(errorMessage?: string | Partial<IAlertModalPayload> | ((e: unknown) => string | Partial<IAlertModalPayload>)) {
  return function actualDecorator<This extends IWithAlertService, Args extends unknown[], Return>(originalMethod: (this: This, ...args: Args) => Return,
    _context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>) {
    return function replacementMethod(this: This, ...args: Args) {
      if (!this.alertService) {
        throw new Error('Did you forget to inject AlertService?');
      }
      return this.alertService.usingProgress(async () => {
        return await originalMethod.call(this, ...args);
      }, async e => {
        const message = errorMessage instanceof Function ? errorMessage(e) : errorMessage;
        await this.alertService.criticalError(message ?? errorToMessage(e), errorToError(e));
        throw e;
      });
    };
  };
}

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorToError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
