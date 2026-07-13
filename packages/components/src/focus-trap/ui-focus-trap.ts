import { customAttribute, INode, resolve } from 'aurelia';
import { FOCUSABLE_SELECTOR } from '../base/focusable';

/**
 * Keeps keyboard focus within the host element while active. Headless replacement for the
 * MDC focus trap: call `trapFocus()` to activate (focuses the first focusable child and cycles
 * Tab within the host) and `releaseFocus()` to deactivate (restores the previously focused element).
 */
@customAttribute('ui-focus-trap')
export class UiFocusTrap {
  private readonly host = resolve(INode) as HTMLElement;
  private active = false;
  private previouslyFocused: HTMLElement | null = null;

  trapFocus(): void {
    if (this.active) {
      return;
    }
    this.active = true;
    this.previouslyFocused = document.activeElement as HTMLElement;
    document.addEventListener('keydown', this.onKeyDown, true);
    const focusable = this.getFocusable();
    if (focusable.length) {
      focusable[0].focus();
    } else {
      this.host.tabIndex = -1;
      this.host.focus();
    }
  }

  releaseFocus(): void {
    if (!this.active) {
      return;
    }
    this.active = false;
    document.removeEventListener('keydown', this.onKeyDown, true);
    this.previouslyFocused?.focus?.();
    this.previouslyFocused = null;
  }

  detaching(): void {
    this.releaseFocus();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') {
      return;
    }
    const focusable = this.getFocusable();
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement;
    if (event.shiftKey) {
      if (active === first || !this.host.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !this.host.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  };

  private getFocusable(): HTMLElement[] {
    return Array.from(this.host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter(el => el.offsetParent !== null || el === document.activeElement);
  }
}
