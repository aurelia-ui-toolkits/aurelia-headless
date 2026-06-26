import { bindable, BindingMode, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';

type DrawerSide = 'left' | 'right' | 'top' | 'bottom';

@customElement('ui-drawer')
export class UiDrawer implements EventListenerObject {
  private readonly host = resolve(INode) as HTMLElement;

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  open: boolean = false;
  openChanged(newValue: boolean): void {
    if (newValue) {
      this.startOpenState();
      return;
    }

    this.stopOpenState();
  }

  @bindable
  side: DrawerSide = 'right';

  @bindable({ set: booleanAttr })
  persistent: boolean = false;

  @bindable({ set: booleanAttr })
  modal: boolean = true;

  @bindable({ set: booleanAttr })
  closeOnOutside: boolean = true;

  @bindable({ set: booleanAttr })
  closeOnEscape: boolean = true;

  @bindable({ set: booleanAttr })
  focusOnOpen: boolean = true;

  @bindable({ set: booleanAttr })
  restoreFocus: boolean = true;

  @bindable
  trigger: HTMLElement | undefined;

  @bindable
  label: string | undefined;

  @bindable
  labelledBy: string | undefined;

  @bindable
  describedBy: string | undefined;

  @bindable
  portalTarget: string | Element | null | undefined;

  @bindable
  portalPosition: InsertPosition = 'beforeend';

  panelElement: HTMLElement | undefined;
  private listening = false;
  private previousFocus: HTMLElement | undefined;

  attaching(): void {
    if (this.open) {
      this.startOpenState();
    }
  }

  detaching(): void {
    this.stopOpenState(false);
  }

  handleEvent(event: Event): void {
    if (!this.open) {
      return;
    }

    if (event.type === 'keydown') {
      this.onWindowKeyDown(event as KeyboardEvent);
      return;
    }

    if (event.type === 'pointerdown') {
      this.onWindowPointerDown(event as PointerEvent);
    }
  }

  private startOpenState(): void {
    if (this.persistent) {
      return;
    }

    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.setListeners(true);
    if (this.focusOnOpen) {
      queueMicrotask(() => this.focusPanel());
    }
  }

  private stopOpenState(restore = true): void {
    this.setListeners(false);
    if (!this.persistent && restore && this.restoreFocus) {
      this.restorePreviousFocus();
    }
  }

  private onWindowPointerDown(event: PointerEvent): void {
    if (!this.closeOnOutside) {
      return;
    }

    const target = event.target as Node | null;
    if (!target || this.panelElement?.contains(target) || this.trigger?.contains(target) || this.isPortalledPopup(target)) {
      return;
    }

    this.requestClose();
  }

  private onWindowKeyDown(event: KeyboardEvent): void {
    if (this.closeOnEscape && event.key === Keys.Escape) {
      event.preventDefault();
      this.requestClose();
      return;
    }

    if (this.modal && event.key === Keys.Tab) {
      this.trapFocus(event);
    }
  }

  private requestClose(): void {
    this.open = false;
    this.host.dispatchEvent(new CustomEvent('drawer-close', { bubbles: true }));
  }

  private setListeners(listen: boolean): void {
    if (listen === this.listening) {
      return;
    }

    this.listening = listen;
    if (listen) {
      window.addEventListener('pointerdown', this, true);
      window.addEventListener('keydown', this, true);
      return;
    }

    window.removeEventListener('pointerdown', this, true);
    window.removeEventListener('keydown', this, true);
  }

  private isPortalledPopup(target: Node): boolean {
    return target instanceof HTMLElement && !!target.closest('.ui-popup__panel');
  }

  private focusPanel(): void {
    const focusTarget = this.getFocusableElements()[0];
    (focusTarget ?? this.panelElement)?.focus();
  }

  private restorePreviousFocus(): void {
    const target = this.trigger ?? this.previousFocus;
    if (target && document.contains(target)) {
      target.focus();
    }
    this.previousFocus = undefined;
  }

  private trapFocus(event: KeyboardEvent): void {
    const focusable = this.getFocusableElements();
    if (!focusable.length) {
      event.preventDefault();
      this.panelElement?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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

    return Array.from(this.panelElement?.querySelectorAll<HTMLElement>(selector) ?? [])
      .filter((element) => this.isFocusable(element));
  }

  private isFocusable(element: HTMLElement): boolean {
    if (element.tabIndex < 0 || element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }
}
