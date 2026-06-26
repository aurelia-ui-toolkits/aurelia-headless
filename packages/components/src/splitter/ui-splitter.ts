import { bindable, BindingMode, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';

type SplitterDirection = 'horizontal' | 'vertical';

@customElement('ui-splitter')
export class UiSplitter implements EventListenerObject {
  private readonly host = resolve(INode) as HTMLElement;
  /** The sibling element this splitter resizes (resolved from `target` on attach). */
  private targetElement: HTMLElement | undefined;
  /** Pointer coordinate (x or y, per direction) captured at drag start. */
  private startPosition = 0;
  /** Target size captured at drag start; deltas are added to this. */
  private startSize = 0;
  /** True while a pointer drag is in progress. */
  private dragging = false;
  /** True once the pointer moved past the click threshold — distinguishes a drag from a click. */
  private pointerMoved = false;
  /** Last non-zero size, restored when expanding from a collapsed state. */
  private expandedSize = 240;
  /** Target's original inline `display`, restored when the target is shown again. */
  private targetDisplay = '';
  /** Target's original inline `overflow`, restored when the target is shown again. */
  private targetOverflow = '';

  /**
   * Current size of the target, in pixels (width for horizontal, height for vertical).
   * Two-way so a host can read/preset it. Ignored while a `fitContent` splitter is content-driven.
   */
  @bindable({ mode: BindingMode.twoWay })
  size: number = 240;
  sizeChanged(): void {
    this.applySize();
    this.updateValueNow();
  }

  /** Drag axis: `horizontal` resizes width, `vertical` resizes height. */
  @bindable
  direction: SplitterDirection = 'horizontal';
  directionChanged(): void {
    this.applySize();
  }

  /** Which sibling the splitter resizes: the one before it (default) or after it. */
  @bindable
  target: 'previous' | 'next' = 'previous';

  /** +1 when sizing the previous sibling, -1 when sizing the next (pointer/key deltas are mirrored). */
  private get sign(): number {
    return this.target === 'next' ? -1 : 1;
  }

  /** Minimum size the target can be dragged/keyed to (px). Also the floor for collapse-aware logic. */
  @bindable
  min: number = 80;

  /** Maximum size the target can be dragged/keyed to (px). Also the cap for `fitContent`. */
  @bindable
  max: number = 800;

  /** Disables dragging, keyboard resizing and click-to-collapse. */
  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  /**
   * Persists the dragged size under `ui-splitter:<storageKey>:size` and restores it on load.
   * Ignored for `fitContent` splitters (those always start content-fit; drags are session-only).
   */
  @bindable
  storageKey: string | undefined;

  /** When true the target sizes to its content (capped at `max`) until the user drags or collapses it. */
  @bindable({ set: booleanAttr })
  fitContent: boolean = false;

  /** Set once the user has explicitly sized the splitter (drag / keyboard / stored value). */
  private manual = false;

  /** Reflected to the divider's `aria-valuenow` for assistive tech (clamped 0..max). */
  valueNow = 240;

  attaching(): void {
    const sibling = this.target === 'next' ? this.host.nextElementSibling : this.host.previousElementSibling;
    this.targetElement = sibling instanceof HTMLElement ? sibling : undefined;
    this.targetDisplay = this.targetElement?.style.display ?? '';
    this.targetOverflow = this.targetElement?.style.overflow ?? '';
    this.expandedSize = this.size;
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
    this.pointerMoved = false;
    this.startPosition = this.direction === 'horizontal' ? event.clientX : event.clientY;
    // In content-fit mode `size` doesn't reflect the rendered size; measure it so the drag is smooth.
    this.startSize = this.fitContent && !this.manual
      ? (this.direction === 'horizontal' ? this.targetElement.offsetWidth : this.targetElement.offsetHeight)
      : this.size;
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
        this.setSize(this.size - this.sign * largeStep, true);
        return;
      }
      if (event.key === Keys.ArrowRight) {
        event.preventDefault();
        this.setSize(this.size + this.sign * largeStep, true);
        return;
      }
    } else {
      if (event.key === Keys.ArrowUp) {
        event.preventDefault();
        this.setSize(this.size - this.sign * largeStep, true);
        return;
      }
      if (event.key === Keys.ArrowDown) {
        event.preventDefault();
        this.setSize(this.size + this.sign * largeStep, true);
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
    this.pointerMoved ||= Math.abs(position - this.startPosition) > 3;
    this.setSize(this.startSize + this.sign * (position - this.startPosition));
  }

  private onPointerUp(): void {
    if (!this.dragging) {
      return;
    }

    this.stopDragging();
    if (!this.pointerMoved) {
      this.toggleCollapsed();
      return;
    }
    this.persistSize();
  }

  private stopDragging(): void {
    this.dragging = false;
    window.removeEventListener('pointermove', this);
    window.removeEventListener('pointerup', this);
  }

  private setSize(size: number, persist = false): void {
    this.manual = true;
    this.size = Math.max(this.minSize, Math.min(this.maxSize, Number(size) || this.minSize));
    this.expandedSize = this.size;
    this.applySize();
    this.updateValueNow();
    if (persist) {
      this.persistSize();
    }
  }

  private toggleCollapsed(): void {
    if (this.fitContent) {
      if (this.manual && this.size <= 0) {
        this.manual = false; // expand back to content-fit
      } else {
        this.manual = true;
        this.expandedSize = this.size;
        this.size = 0;
      }
      this.applySize();
      this.updateValueNow();
      this.persistSize();
      return;
    }
    if (this.size <= 0) {
      this.size = Math.max(this.minSize, Math.min(this.maxSize, this.expandedSize || this.minSize));
    } else {
      this.expandedSize = this.size;
      this.size = 0;
    }
    this.applySize();
    this.updateValueNow();
    this.persistSize();
  }

  private applySize(): void {
    const t = this.targetElement;
    if (!t) {
      return;
    }

    if (this.fitContent && !this.manual) {
      // Content-driven size, capped at max; the divider can still be dragged to take over.
      t.style.display = this.targetDisplay;
      t.style.flexGrow = '0';
      t.style.flexShrink = '0';
      t.style.flexBasis = 'auto';
      t.style.overflow = this.targetOverflow || 'auto';
      if (this.direction === 'horizontal') {
        t.style.width = '';
        t.style.height = '';
        t.style.maxWidth = `${this.maxSize}px`;
        t.style.maxHeight = '';
      } else {
        t.style.height = '';
        t.style.width = '';
        t.style.maxHeight = `${this.maxSize}px`;
        t.style.maxWidth = '';
      }
      return;
    }

    const sizeValue = Math.max(0, Number(this.size) || 0);
    const size = `${sizeValue}px`;
    t.style.display = sizeValue === 0 ? 'none' : this.targetDisplay;
    t.style.flexGrow = '0';
    t.style.flexShrink = '0';
    t.style.overflow = sizeValue === 0 ? 'hidden' : this.targetOverflow;
    t.style.maxWidth = '';
    t.style.maxHeight = '';
    if (this.direction === 'horizontal') {
      t.style.width = size;
      t.style.flexBasis = size;
      t.style.height = '';
      return;
    }

    t.style.height = size;
    t.style.flexBasis = size;
    t.style.width = '';
  }
  private updateValueNow(): void {
    this.valueNow = Math.max(0, Math.min(this.maxSize, Number(this.size) || 0));
  }

  private loadSize(): void {
    // Content-fit splitters always start sized to content; a drag is session-only.
    if (!this.storageKey || this.fitContent) {
      return;
    }

    try {
      const value = localStorage.getItem(this.storageId);
      if (value !== null) {
        this.manual = true;
        this.size = Math.max(0, Math.min(this.maxSize, Number(value) || 0));
        if (this.size > 0) {
          this.expandedSize = this.size;
        }
      }
    } catch {
      // Ignore unavailable storage.
    }
  }

  private persistSize(): void {
    if (!this.storageKey || this.fitContent) {
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
