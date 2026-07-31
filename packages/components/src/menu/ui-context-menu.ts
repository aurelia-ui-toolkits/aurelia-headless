import { UiMenu } from './ui-menu';
import { bindable, customAttribute, queueTask, resolve } from 'aurelia';

const menuAnchorClass = 'ui-context-menu-anchor';

/** Opens the bound headless ui-menu at the pointer position on right-click. */
@customAttribute('ui-context-menu')
export class UiContextMenuCustomAttribute implements EventListenerObject {
  private element = resolve(Element);
  private menuAnchor: HTMLDivElement | undefined;

  @bindable()
  value: UiMenu | undefined;

  /** Optional CSS selector; when set, the menu only opens if the right-clicked
   *  target is within an element matching the selector (e.g. limit to "thead"). */
  @bindable()
  filter: string | undefined;

  attached() {
    this.element.addEventListener('contextmenu', this);
    this.menuAnchor = document.querySelector<HTMLDivElement>(`div.${menuAnchorClass}`) ?? undefined;
    if (!this.menuAnchor) {
      this.menuAnchor = document.createElement('div');
      this.menuAnchor.classList.add(menuAnchorClass);
      this.menuAnchor.style.position = 'fixed';
      document.body.appendChild(this.menuAnchor);
    }
  }

  detaching() {
    this.element.removeEventListener('contextmenu', this);
    this.menuAnchor = undefined;
  }

  handleEvent(e: Event) {
    // `contextmenu` is a PointerEvent in Chrome but a plain MouseEvent in Firefox, and keyboard
    // invocation (Menu key / Shift+F10) also fires a MouseEvent — match the base type so the menu
    // opens in all cases. PointerEvent extends MouseEvent, so Chrome still matches.
    if (e.type !== 'contextmenu' || !(e instanceof MouseEvent)) {
      return;
    }

    if (this.filter) {
      const match = (e.target as Element | null)?.closest(this.filter);
      if (!match || !this.element.contains(match)) {
        return;
      }
    }

    this.openMenu(e);
    e.preventDefault();
    return true;
  }

  private openMenu(e: MouseEvent) {
    const menu = this.value;
    const menuAnchor = this.menuAnchor;
    if (!menu || !menuAnchor) {
      return;
    }

    menuAnchor.style.left = `${e.clientX}px`;
    menuAnchor.style.top = `${e.clientY}px`;
    menu.anchor = menuAnchor;
    if (menu.open) {
      // Re-anchor by closing then reopening on the next tick.
      menu.open = false;
      queueTask(() => {
        menu.anchor = menuAnchor;
        menu.open = true;
      });
    } else {
      menu.open = true;
    }
  }
}
