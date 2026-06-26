import { bindable, BindingMode, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';

type PopupPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'right-start' | 'right-end' | 'left-start' | 'left-end';

@customElement('ui-popup')
export class UiPopup {
  readonly element = resolve(INode) as HTMLElement;
  readonly slotHost = this;
  private readonly hiddenPanelStyle = 'position: fixed; top: -10000px; left: -10000px; visibility: hidden;';

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  open: boolean = false;
  openChanged(newValue: boolean): void {
    if (newValue) {
      this.panelStyle = this.hiddenPanelStyle;
      this.startOpenState();
      this.element.dispatchEvent(new CustomEvent('popup-opened', { bubbles: true }));
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

  @bindable({ set: booleanAttr })
  focusOnOpen: boolean = true;

  @bindable({ set: booleanAttr })
  restoreFocus: boolean = true;

  @bindable
  anchor: Element | undefined;
  anchorChanged(newValue: Element | undefined, oldValue: Element | undefined): void {
    oldValue?.removeEventListener('pointerdown', this.onAnchorPointerDownCapture, true);
    newValue?.addEventListener('pointerdown', this.onAnchorPointerDownCapture, true);
    this.queuePositionUpdate();
  }

  @bindable
  tabReference: HTMLElement | undefined;

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

  @bindable
  exposedHost: unknown;

  @bindable
  panelRole: string = 'dialog';

  @bindable
  panelId: string | undefined;

  panelStyle = this.hiddenPanelStyle;
  panelElement: HTMLElement | undefined;

  get effectiveSlotHost(): unknown {
    return this.exposedHost ?? this.slotHost;
  }

  /**
   * Resolved portal target. A modal `<dialog>` renders in the browser top layer, so anything
   * portaled to `<body>` would be hidden beneath it. When the popup lives inside a `<dialog>`
   * and no explicit element target is given, portal into that dialog (same top layer) instead.
   */
  get effectivePortalTarget(): string | Element | null | undefined {
    if (this.portalTarget && this.portalTarget !== 'body') {
      return this.portalTarget;
    }
    const dialog = this.element.closest('dialog');
    return dialog ?? this.portalTarget;
  }

  attaching(): void {
    this.anchor?.addEventListener('pointerdown', this.onAnchorPointerDownCapture, true);
    if (this.open) {
      this.startOpenState();
    }
  }

  detaching(): void {
    this.anchor?.removeEventListener('pointerdown', this.onAnchorPointerDownCapture, true);
    this.stopOpenState();
  }

  private listening = false;
  private anchorRectSnapshot: DOMRect | undefined;
  private previousFocus: HTMLElement | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private observedPanelHeight: number | undefined;
  private observedPanelScrollHeight: number | undefined;
  private mutationObserver: MutationObserver | undefined;
  private currentPlaceTop: boolean | undefined;
  private preservePlacementUpdate = false;

  private readonly onAnchorPointerDownCapture = (): void => {
    if (!this.anchor) {
      return;
    }

    this.anchorRectSnapshot = this.anchor.getBoundingClientRect();
  };

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
    if (!this.open) {
      return;
    }

    if (event.key === Keys.Tab && this.panelElement?.contains(event.target as Node | null)) {
      this.focusNextFromTabReference(event.shiftKey);
      event.preventDefault();
      return;
    }

    if (!this.closeOnEscape || event.key !== Keys.Escape) {
      return;
    }

    event.preventDefault();
    this.requestClose();
  };

  private readonly onWindowLayoutChange = (): void => {
    this.queuePositionUpdate();
  };

  private startOpenState(): void {
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.setListeners(true);
    this.observePanelSize();
    if (this.focusOnOpen) {
      this.focusPanel();
    }
  }

  private stopOpenState(): void {
    this.setListeners(false);
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
    this.observedPanelHeight = undefined;
    this.observedPanelScrollHeight = undefined;
    this.currentPlaceTop = undefined;
    this.preservePlacementUpdate = false;
    this.anchorRectSnapshot = undefined;
    this.panelStyle = this.hiddenPanelStyle;
    if (this.restoreFocus) {
      this.restorePreviousFocus();
    }
  }

  private requestClose(): void {
    this.open = false;
  }

  onListSelect(event: Event): void {
    event.stopPropagation();
    this.element.dispatchEvent(new CustomEvent('list-select', {
      bubbles: true,
      detail: (event as CustomEvent).detail
    }));
  }

  onListAction(event: Event): void {
    event.stopPropagation();
    this.element.dispatchEvent(new CustomEvent('list-action', { bubbles: true }));
  }

  focus(): void {
    this.focusPanel();
  }

  contains(target: Node): boolean {
    return !!this.panelElement?.contains(target);
  }

  private focusPanel(): void {
    const focusTarget = this.panelElement?.querySelector<HTMLElement>('[tabindex]');
    (focusTarget ?? this.panelElement)?.focus();
  }

  private restorePreviousFocus(): void {
    if (!this.previousFocus || !document.contains(this.previousFocus)) {
      this.previousFocus = undefined;
      return;
    }

    this.previousFocus.focus();
    this.previousFocus = undefined;
  }

  private focusNextFromTabReference(reverse: boolean): void {
    const reference = this.tabReference ?? this.anchor;
    if (!(reference instanceof HTMLElement)) {
      this.requestClose();
      return;
    }

    const focusable = this.getFocusableElements();
    const index = focusable.indexOf(reference);
    if (index < 0) {
      this.requestClose();
      return;
    }

    const target = focusable[index + (reverse ? -1 : 1)];

    this.element.dispatchEvent(new CustomEvent('popup-tab-away', {
      bubbles: true,
      detail: { reverse }
    }));
    this.requestClose();
    target?.focus();
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      'iframe',
      '[tabindex]',
      '[contenteditable="true"]'
    ].join(',');

    return Array.from(document.querySelectorAll<HTMLElement>(selector))
      .filter((element) => this.isFocusable(element));
  }

  private isFocusable(element: HTMLElement): boolean {
    if (this.panelElement?.contains(element)) {
      return false;
    }

    if (element.tabIndex < 0 || element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  private setListeners(listen: boolean): void {
    if (listen === this.listening) {
      return;
    }

    this.listening = listen;
    if (listen) {
      window.addEventListener('pointerdown', this.onWindowPointerDown, true);
      window.addEventListener('keydown', this.onWindowKeyDown, true);
      window.addEventListener('resize', this.onWindowLayoutChange);
      window.addEventListener('scroll', this.onWindowLayoutChange, true);
      return;
    }

    window.removeEventListener('pointerdown', this.onWindowPointerDown, true);
    window.removeEventListener('keydown', this.onWindowKeyDown, true);
    window.removeEventListener('resize', this.onWindowLayoutChange);
    window.removeEventListener('scroll', this.onWindowLayoutChange, true);
  }

  private observePanelSize(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
    this.observedPanelHeight = undefined;
    this.observedPanelScrollHeight = undefined;

    if (!this.open || !this.panelElement) {
      return;
    }

    this.resizeObserver = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height;
      if (this.observedPanelHeight === undefined) {
        this.observedPanelHeight = height;
        if (height > 0) {
          this.queuePositionUpdate();
        }
        return;
      }

      const preservePlacement = height <= this.observedPanelHeight;
      this.observedPanelHeight = height;
      this.queuePositionUpdate(preservePlacement);
    });
    this.resizeObserver.observe(this.panelElement);
    this.mutationObserver = new MutationObserver(() => this.handlePanelContentChange());
    this.mutationObserver.observe(this.panelElement, { childList: true, subtree: true, characterData: true });
  }

  private handlePanelContentChange(): void {
    if (!this.open || !this.panelElement) {
      return;
    }

    const scrollHeight = this.panelElement.scrollHeight;
    if (this.observedPanelScrollHeight === undefined) {
      this.observedPanelScrollHeight = scrollHeight;
      return;
    }

    const preservePlacement = scrollHeight <= this.observedPanelScrollHeight;
    this.observedPanelScrollHeight = scrollHeight;
    this.queuePositionUpdate(preservePlacement);
  }

  private queuePositionUpdate(preservePlacement = false): void {
    if (!this.open) {
      return;
    }

    this.preservePlacementUpdate = this.preservePlacementUpdate || preservePlacement;
    const shouldPreservePlacement = this.preservePlacementUpdate;
    this.preservePlacementUpdate = false;
    this.updatePosition(shouldPreservePlacement);
  }

  private updatePosition(preservePlacement = false): void {
    if (!this.open || !this.panelElement) {
      return;
    }

    if (!this.anchor) {
      this.panelStyle = this.hiddenPanelStyle;
      return;
    }

    const anchorRect = this.anchorRectSnapshot || this.anchor.getBoundingClientRect();
    this.anchorRectSnapshot = undefined;
    const panelRect = this.panelElement.getBoundingClientRect();
    this.observedPanelHeight = panelRect.height;
    this.observedPanelScrollHeight = this.panelElement.scrollHeight;
    const viewportPadding = 8;
    const alignEnd = this.placement.endsWith('end');
    if (this.placement.startsWith('right') || this.placement.startsWith('left')) {
      const preferRight = this.placement.startsWith('right');
      const fallbackRight = anchorRect.right + this.offset;
      const availableRight = Math.max(0, window.innerWidth - fallbackRight - viewportPadding);
      const availableLeft = Math.max(0, anchorRect.left - this.offset - viewportPadding);
      const placeRight = preferRight
        ? panelRect.width <= availableRight || availableRight >= availableLeft
        : panelRect.width > availableLeft && availableRight > availableLeft;
      const availableWidth = placeRight ? availableRight : availableLeft;
      const panelWidth = Math.min(panelRect.width, availableWidth);

      let left = placeRight ? fallbackRight : anchorRect.left - this.offset - panelWidth;
      left = Math.max(viewportPadding, Math.min(left, window.innerWidth - panelWidth - viewportPadding));

      let top = alignEnd ? anchorRect.bottom - panelRect.height : anchorRect.top;
      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - panelRect.height - viewportPadding));

      const maxWidth = `max-width: ${availableWidth}px;`;
      const maxHeight = `max-height: calc(100vh - ${viewportPadding * 2}px); --ui-popup-available-height: calc(100vh - ${viewportPadding * 2}px);`;
      const minWidth = this.matchAnchorWidth ? `min-width: min(${anchorRect.width}px, calc(100vw - ${viewportPadding * 2}px));` : '';
      this.panelStyle = `position: fixed; top: ${top}px; left: ${left}px; ${maxWidth} ${maxHeight} ${minWidth}`;
      return;
    }

    const preferTop = this.placement.startsWith('top');
    const fallbackBottom = anchorRect.bottom + this.offset;
    const availableTop = Math.max(0, anchorRect.top - this.offset - viewportPadding);
    const availableBottom = Math.max(0, window.innerHeight - fallbackBottom - viewportPadding);
    const nextPlaceTop = preferTop
      ? panelRect.height <= availableTop || availableTop >= availableBottom
      : panelRect.height > availableBottom && availableTop > availableBottom;
    const placeTop = preservePlacement && this.currentPlaceTop !== undefined ? this.currentPlaceTop : nextPlaceTop;
    this.currentPlaceTop = placeTop;
    const availableHeight = placeTop ? availableTop : availableBottom;
    const panelHeight = Math.min(panelRect.height, availableHeight);

    let top = placeTop ? anchorRect.top - this.offset - panelHeight : fallbackBottom;
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - panelHeight - viewportPadding));

    let left = alignEnd ? anchorRect.right - panelRect.width : anchorRect.left;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - panelRect.width - viewportPadding));

    const maxWidth = `max-width: calc(100vw - ${viewportPadding * 2}px);`;
    const maxHeight = `max-height: ${availableHeight}px; --ui-popup-available-height: ${availableHeight}px;`;
    const minWidth = this.matchAnchorWidth ? `min-width: min(${anchorRect.width}px, calc(100vw - ${viewportPadding * 2}px));` : '';
    this.panelStyle = `position: fixed; top: ${top}px; left: ${left}px; ${maxWidth} ${maxHeight} ${minWidth}`;
  }
}
