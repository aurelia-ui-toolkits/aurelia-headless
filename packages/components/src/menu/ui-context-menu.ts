import { UiMenu } from './ui-menu';
import { bindable, customAttribute, queueTask, resolve } from 'aurelia';

/** Opens the bound headless ui-menu at the pointer position on right-click. */
@customAttribute('ui-context-menu')
export class UiContextMenuCustomAttribute implements EventListenerObject {
  private element = resolve(Element);
  private menuAnchor: HTMLDivElement;

  @bindable()
  value: UiMenu;

  /** Optional CSS selector; when set, the menu only opens if the right-clicked
   *  target is within an element matching the selector (e.g. limit to "thead"). */
  @bindable()
  filter: string | undefined;

  attached() {
    this.element.addEventListener('contextmenu', this);
    this.menuAnchor = document.querySelector('div.ui-context-menu-anchor');
    if (!this.menuAnchor) {
      this.menuAnchor = document.createElement('div');
      this.menuAnchor.classList.add('ui-context-menu-anchor');
      this.menuAnchor.style.position = 'fixed';
      document.body.appendChild(this.menuAnchor);
    }
  }

  detaching() {
    this.element.removeEventListener('contextmenu', this);
  }

  handleEvent(e: Event) {
    if (e.type !== 'contextmenu' || !(e instanceof PointerEvent)) {
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

  private openMenu(e: PointerEvent) {
    this.menuAnchor.style.left = `${e.clientX}px`;
    this.menuAnchor.style.top = `${e.clientY}px`;
    this.value.anchor = this.menuAnchor;
    if (this.value.open) {
      // Re-anchor by closing then reopening on the next tick.
      this.value.open = false;
      queueTask(() => {
        this.value.anchor = this.menuAnchor;
        this.value.open = true;
      });
    } else {
      this.value.open = true;
    }
  }
}
