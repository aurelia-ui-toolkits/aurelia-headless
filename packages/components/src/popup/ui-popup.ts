import { bindable, BindingMode, customElement } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import template from './ui-popup.html?raw';

type PopupPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

@customElement({ name: 'ui-popup', template })
export class UiPopup {
  private readonly hiddenPanelStyle = 'position: fixed; top: -10000px; left: -10000px; visibility: hidden;';

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  open: boolean = false;
  openChanged(newValue: boolean): void {
    if (newValue) {
      this.panelStyle = this.hiddenPanelStyle;
      this.startOpenState();
      return;
    }

    this.stopOpenState();
  }

  @bindable({ set: booleanAttr })
  closeOnOutside: boolean = true;

  @bindable({ set: booleanAttr })
  closeOnEscape: boolean = true;

  @bindable({ set: booleanAttr })
  matchAnchorWidth: boolean = false;
  matchAnchorWidthChanged(): void {
    this.queuePositionUpdate();
  }

  @bindable
  anchor: Element | undefined;
  anchorChanged(): void {
    this.queuePositionUpdate();
  }

  @bindable
  placement: PopupPlacement = 'bottom-start';
  placementChanged(): void {
    this.queuePositionUpdate();
  }

  @bindable
  offset: number = 8;
  offsetChanged(): void {
    this.queuePositionUpdate();
  }

  @bindable
  portalTarget: string | Element | null | undefined;

  @bindable
  portalPosition: InsertPosition = 'beforeend';

  panelStyle = this.hiddenPanelStyle;
  panelElement: HTMLElement | undefined;

  attaching(): void {
    if (this.open) {
      this.startOpenState();
    }
  }

  detaching(): void {
    this.stopOpenState();
  }

  private listening = false;
  private positionFrame: number | undefined;

  private readonly onWindowPointerDown = (event: PointerEvent): void => {
    if (!this.open || !this.closeOnOutside) {
      return;
    }

    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (this.panelElement?.contains(target) || this.anchor?.contains(target)) {
      return;
    }

    this.requestClose();
  };

  private readonly onWindowKeyDown = (event: KeyboardEvent): void => {
    if (!this.open || !this.closeOnEscape || event.key !== Keys.Escape) {
      return;
    }

    event.preventDefault();
    this.requestClose();
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
    this.panelStyle = this.hiddenPanelStyle;
    if (this.positionFrame) {
      cancelAnimationFrame(this.positionFrame);
      this.positionFrame = undefined;
    }
  }

  private requestClose(): void {
    this.open = false;
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

    if (this.positionFrame) {
      cancelAnimationFrame(this.positionFrame);
    }

    this.positionFrame = requestAnimationFrame(() => {
      this.positionFrame = undefined;
      this.updatePosition();
    });
  }

  private updatePosition(): void {
    if (!this.open || !this.panelElement) {
      return;
    }

    if (!this.anchor) {
      this.panelStyle = this.hiddenPanelStyle;
      return;
    }

    const anchorRect = this.anchor.getBoundingClientRect();
    const panelRect = this.panelElement.getBoundingClientRect();
    const viewportPadding = 8;
    const alignEnd = this.placement.endsWith('end');
    const preferTop = this.placement.startsWith('top');
    const fallbackTop = anchorRect.top - panelRect.height - this.offset;
    const fallbackBottom = anchorRect.bottom + this.offset;

    let top = preferTop ? fallbackTop : fallbackBottom;
    if (top < viewportPadding) {
      top = fallbackBottom;
    }
    if (top + panelRect.height > window.innerHeight - viewportPadding) {
      top = fallbackTop;
    }
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - panelRect.height - viewportPadding));

    let left = alignEnd ? anchorRect.right - panelRect.width : anchorRect.left;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - panelRect.width - viewportPadding));

    const minWidth = this.matchAnchorWidth ? `min-width: ${Math.round(anchorRect.width)}px;` : '';
    this.panelStyle = `position: fixed; top: ${Math.round(top)}px; left: ${Math.round(left)}px; ${minWidth}`;
  }
}
