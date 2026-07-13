/** Selector for elements that can, in principle, take keyboard focus. */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"])'
].join(',');

/** True if the element can currently receive focus (tabbable, enabled, not hidden). */
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0 || element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

/** Focusable descendants of `root`, in DOM order. */
export function getFocusableWithin(root: ParentNode | null | undefined): HTMLElement[] {
  return Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []).filter(isFocusable);
}
