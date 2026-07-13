import { Aurelia, IContainer, resolve } from 'aurelia';
import { AlertTone } from '../alert/ui-alert';

export interface UiToastOptions {
  tone?: AlertTone;
  title?: string;
  message: string;
  duration?: number;
}

export interface UiToastMessage extends Required<Pick<UiToastOptions, 'tone' | 'message' | 'duration'>> {
  id: number;
  title?: string;
}

export class UiToastService {
  private readonly container = resolve(IContainer);
  private host: HTMLElement | undefined;
  private enhancedPromise: Promise<void> | undefined;
  private nextId = 0;
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  toasts: UiToastMessage[] = [];

  async show(options: string | UiToastOptions): Promise<number> {
    await this.ensureEnhanced();
    const toast = this.createToast(options);
    this.toasts = [...this.toasts, toast];

    if (toast.duration > 0) {
      this.timers.set(toast.id, setTimeout(() => this.remove(toast.id), toast.duration));
    }

    return toast.id;
  }

  info(message: string, title?: string): Promise<number> {
    return this.show({ tone: 'info', title, message });
  }

  success(message: string, title?: string): Promise<number> {
    return this.show({ tone: 'success', title, message });
  }

  warning(message: string, title?: string): Promise<number> {
    return this.show({ tone: 'warning', title, message });
  }

  danger(message: string, title?: string): Promise<number> {
    return this.show({ tone: 'danger', title, message, duration: 7000 });
  }

  remove(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.toasts = [];
  }

  private createToast(options: string | UiToastOptions): UiToastMessage {
    const normalized = typeof options === 'string' ? { message: options } : options;
    return {
      id: ++this.nextId,
      tone: normalized.tone ?? 'info',
      title: normalized.title,
      message: normalized.message,
      duration: normalized.duration ?? 5000
    };
  }

  private ensureEnhanced(): Promise<void> {
    // Memoize the in-flight enhancement so two show() calls in the same tick don't each
    // create a host and enhance it (which would append duplicate toast regions).
    return this.enhancedPromise ??= this.createEnhanced();
  }

  private async createEnhanced(): Promise<void> {
    this.host = document.createElement('div');
    this.host.className = 'ui-toast-host';
    this.host.innerHTML = `<ui-toast-region toasts.bind="toasts" toast-close.trigger="remove($event.detail)"></ui-toast-region>`;
    document.body.append(this.host);

    await Aurelia.enhance({
      host: this.host,
      component: this,
      container: this.container
    });
  }
}
