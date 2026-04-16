import { bindable, BindingMode, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import template from './ui-popup.html?raw';

type PopupPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

@customElement({ name: 'ui-popup', template })
export class UiPopup {
  readonly element = resolve(INode) as HTMLElement;

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  open: boolean = false;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable({ set: booleanAttr })
  closeOnOutside: boolean = true;

  @bindable({ set: booleanAttr })
  closeOnEscape: boolean = true;

  @bindable({ set: booleanAttr })
  matchTriggerWidth: boolean = false;

  @bindable
  placement: PopupPlacement = 'bottom-start';

  @bindable
  offset: number = 8;

  @bindable
  portalTarget: string | Element | null | undefined;

  @bindable
  portalPosition: InsertPosition = 'beforeend';

  triggerId = `ui-popup-trigger-${++nextPopupId}`;
  panelId = `ui-popup-panel-${nextPopupId}`;
  panelStyle = '';

  triggerElement: HTMLElement | null = null;
  panelElement: HTMLElement | null = null;

  openChanged(newValue: boolean): void {
    if (newValue) {
      this.startOpenState();
      return;
    }

    this.stopOpenState();
  }

  attaching(): void {
    if (this.open) {
      this.startOpenState();
    }
  }

  detaching(): void {
    this.stopOpenState();
  }

  onTriggerClick(event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault();
      return;
    }

    this.open = !this.open;
  }

  onTriggerKeyDown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }

    if (event.key === Keys.Enter || event.key === Keys.Space || event.key === Keys.ArrowDown) {
      event.preventDefault();
      this.open = true;
      return;
    }

    if (event.key === Keys.Escape && this.open) {
      event.preventDefault();
      this.closeAndFocusTrigger();
    }
  }

  private listening = false;
  private positionFrame: number | null = null;

  private readonly onWindowPointerDown = (event: PointerEvent): void => {
    if (!this.open || !this.closeOnOutside) {
      return;
    }

    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (this.triggerElement?.contains(target) || this.panelElement?.contains(target)) {
      return;
    }

    this.closeAndFocusTrigger();
  };

  private readonly onWindowKeyDown = (event: KeyboardEvent): void => {
    if (!this.open || !this.closeOnEscape || event.key !== Keys.Escape) {
      return;
    }

    event.preventDefault();
    this.closeAndFocusTrigger();
  };

  private readonly onWindowLayoutChange = (): void => {
    this.queuePositionUpdate();
  };

  private startOpenState(): void {
    this.setListeners(true);
    this.queuePositionUpdate();
  }

  private stopOpenState(): void {
    this.setListeners(false);
    if (this.positionFrame !== null) {
      cancelAnimationFrame(this.positionFrame);
      this.positionFrame = null;
    }
  }

  private closeAndFocusTrigger(): void {
    this.open = false;
    this.triggerElement?.focus();
  }

  private setListeners(listen: boolean): void {
    if (listen === this.listening) {
      return;
    }

    this.listening = listen;
    const action = listen ? 'addEventListener' : 'removeEventListener';
    window[action]('pointerdown', this.onWindowPointerDown, true);
    window[action]('keydown', this.onWindowKeyDown, true);
    window[action]('resize', this.onWindowLayoutChange);
    window[action]('scroll', this.onWindowLayoutChange, true);
  }

  private queuePositionUpdate(): void {
    if (!this.open) {
      return;
    }

    if (this.positionFrame !== null) {
      cancelAnimationFrame(this.positionFrame);
    }

    this.positionFrame = requestAnimationFrame(() => {
      this.positionFrame = null;
      this.updatePosition();
    });
  }

  private updatePosition(): void {
    if (!this.open || !this.triggerElement || !this.panelElement) {
      return;
    }

    const triggerRect = this.triggerElement.getBoundingClientRect();
    const panelRect = this.panelElement.getBoundingClientRect();
    const viewportPadding = 8;
    const alignEnd = this.placement.endsWith('end');
    const preferTop = this.placement.startsWith('top');
    const fallbackTop = triggerRect.top - panelRect.height - this.offset;
    const fallbackBottom = triggerRect.bottom + this.offset;

    let top = preferTop ? fallbackTop : fallbackBottom;
    if (top < viewportPadding) {
      top = fallbackBottom;
    }
    if (top + panelRect.height > window.innerHeight - viewportPadding) {
      top = fallbackTop;
    }
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - panelRect.height - viewportPadding));

    let left = alignEnd ? triggerRect.right - panelRect.width : triggerRect.left;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - panelRect.width - viewportPadding));

    const minWidth = this.matchTriggerWidth ? `min-width: ${Math.round(triggerRect.width)}px;` : '';
    this.panelStyle = `position: fixed; top: ${Math.round(top)}px; left: ${Math.round(left)}px; ${minWidth}`;
  }
}

let nextPopupId = 0;
