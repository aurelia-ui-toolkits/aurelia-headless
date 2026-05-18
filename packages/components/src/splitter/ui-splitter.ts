import { bindable, BindingMode, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import template from './ui-splitter.html?raw';

type SplitterDirection = 'horizontal' | 'vertical';

@customElement({ name: 'ui-splitter', template })
export class UiSplitter implements EventListenerObject {
  private readonly host = resolve(INode) as HTMLElement;
  private targetElement: HTMLElement | undefined;
  private startPosition = 0;
  private startSize = 0;
  private dragging = false;

  @bindable({ mode: BindingMode.twoWay })
  size: number = 240;
  sizeChanged(): void {
    this.applySize();
    this.updateValueNow();
  }

  @bindable
  direction: SplitterDirection = 'horizontal';
  directionChanged(): void {
    this.applySize();
  }

  @bindable
  min: number = 80;

  @bindable
  max: number = 800;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable
  storageKey: string | undefined;

  valueNow = 240;

  attaching(): void {
    this.targetElement = this.host.previousElementSibling instanceof HTMLElement
      ? this.host.previousElementSibling
      : undefined;
    this.loadSize();
    this.applySize();
    this.updateValueNow();
  }

  detaching(): void {
    this.stopDragging();
  }

  handleEvent(event: Event): void {
    if (event.type === 'pointermove') {
      this.onPointerMove(event as PointerEvent);
      return;
    }

    if (event.type === 'pointerup') {
      this.onPointerUp();
    }
  }

  onPointerDown(event: PointerEvent): void {
    if (this.disabled || !this.targetElement) {
      return;
    }

    event.preventDefault();
    this.dragging = true;
    this.startPosition = this.direction === 'horizontal' ? event.clientX : event.clientY;
    this.startSize = this.valueNow;
    this.host.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', this);
    window.addEventListener('pointerup', this);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }

    const largeStep = event.shiftKey ? 50 : 10;
    if (this.direction === 'horizontal') {
      if (event.key === Keys.ArrowLeft) {
        event.preventDefault();
        this.setSize(this.size - largeStep, true);
        return;
      }
      if (event.key === Keys.ArrowRight) {
        event.preventDefault();
        this.setSize(this.size + largeStep, true);
        return;
      }
    } else {
      if (event.key === Keys.ArrowUp) {
        event.preventDefault();
        this.setSize(this.size - largeStep, true);
        return;
      }
      if (event.key === Keys.ArrowDown) {
        event.preventDefault();
        this.setSize(this.size + largeStep, true);
        return;
      }
    }

    if (event.key === Keys.Home) {
      event.preventDefault();
      this.setSize(this.minSize, true);
      return;
    }

    if (event.key === Keys.End) {
      event.preventDefault();
      this.setSize(this.maxSize, true);
    }
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }

    const position = this.direction === 'horizontal' ? event.clientX : event.clientY;
    this.setSize(this.startSize + position - this.startPosition);
  }

  private onPointerUp(): void {
    if (!this.dragging) {
      return;
    }

    this.stopDragging();
    this.persistSize();
  }

  private stopDragging(): void {
    this.dragging = false;
    window.removeEventListener('pointermove', this);
    window.removeEventListener('pointerup', this);
  }

  private setSize(size: number, persist = false): void {
    this.size = Math.max(this.minSize, Math.min(this.maxSize, Number(size) || this.minSize));
    this.applySize();
    this.updateValueNow();
    if (persist) {
      this.persistSize();
    }
  }

  private applySize(): void {
    if (!this.targetElement) {
      return;
    }

    const size = `${this.size}px`;
    this.targetElement.style.flexGrow = '0';
    this.targetElement.style.flexShrink = '0';
    if (this.direction === 'horizontal') {
      this.targetElement.style.width = size;
      this.targetElement.style.flexBasis = size;
      this.targetElement.style.height = '';
      return;
    }

    this.targetElement.style.height = size;
    this.targetElement.style.flexBasis = size;
    this.targetElement.style.width = '';
  }
  private updateValueNow(): void {
    this.valueNow = Math.max(this.minSize, Math.min(this.maxSize, Number(this.size) || this.minSize));
  }

  private loadSize(): void {
    if (!this.storageKey) {
      return;
    }

    try {
      const value = localStorage.getItem(this.storageId);
      if (value !== null) {
        this.size = Math.max(this.minSize, Math.min(this.maxSize, Number(value) || this.size));
      }
    } catch {
      // Ignore unavailable storage.
    }
  }

  private persistSize(): void {
    if (!this.storageKey) {
      return;
    }

    try {
      localStorage.setItem(this.storageId, String(this.size));
    } catch {
      // Ignore unavailable storage.
    }
  }

  private get minSize(): number {
    return Math.max(0, Number(this.min) || 0);
  }

  private get maxSize(): number {
    return Math.max(this.minSize, Number(this.max) || this.minSize);
  }

  private get storageId(): string {
    return `ui-splitter:${this.storageKey}:size`;
  }
}
