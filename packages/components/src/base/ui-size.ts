import { bindable, BindingMode, customAttribute, resolve } from 'aurelia';

export interface Size {
  width: number;
  height: number;
}

/** Observes the host element's size and exposes it (and width/height) via from-view bindings. */
@customAttribute('ui-size')
export class UiSizeCustomAttribute {

  private element = resolve(Element) as HTMLElement;

  private observer: { observe(element: Element): void; disconnect(): void } | undefined;
  @bindable({ mode: BindingMode.fromView })
  public value: Size = { width: 0, height: 0 };

  @bindable({ mode: BindingMode.fromView })
  public width: number = 0;

  @bindable({ mode: BindingMode.fromView })
  public height: number = 0;

  public attached() {
    this.observer = this.getObserver();
    this.observer?.observe(this.element);
  }

  public detaching() {
    this.observer?.disconnect();
    this.observer = void 0;
  }

  public getObserver() {
    if (typeof globalThis.ResizeObserver === 'function') {
      return new globalThis.ResizeObserver((records: { contentRect: DOMRectReadOnly }[]) => {
        const rect = records[0].contentRect;
        this.value = { width: rect.width, height: rect.height };
      });
    } else {
      return new ElementSizeDirtyChecker((size) => {
        this.value = size;
      });
    }
  }

  public valueChanged(size: Size) {
    this.value = size;
    this.width = size.width;
    this.height = size.height;
  }
}

class ElementSizeDirtyChecker {

  private callback: (size: Size) => unknown;
  private rate: number;
  private size: { width: number; height: number };
  private timerId: unknown;

  constructor(callback: (size: Size) => unknown, rate = 330 /* 3 times a second */) {
    this.callback = callback;
    this.rate = rate;
    this.size = { width: 0, height: 0 };
  }

  public observe(element: HTMLElement) {
    this.timerId = setInterval(() => {
      const { width, height } = element.getBoundingClientRect();
      const currentSize = this.size;
      if (width !== currentSize.width || height !== currentSize.height) {
        this.size = { width, height };
        if (typeof this.callback === 'function') {
          this.callback(this.size);
        }
      }
    }, this.rate);
  }

  public disconnect() {
    clearInterval(this.timerId as number);
  }
}
