import { bindable, customElement, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';

@customElement('ui-floating-actions')
export class UiFloatingActions {
  /** When set, all actions are shown and the collapse trigger is never rendered. */
  @bindable({ set: booleanAttr })
  alwaysExpanded: boolean = false;

  @slotted('[as-element="ui-icon-button"], ui-icon-button, .ui-icon-button')
  items?: readonly HTMLElement[];

  /** Toggled by click/tap (so expansion works where hover is unavailable). */
  open: boolean = false;
  /** Set while a pointer is over the control (hover-to-expand). */
  hovering: boolean = false;

  get expanded(): boolean {
    const itemCount = this.items?.length ?? 0;
    return itemCount > 0 && (itemCount === 1 || this.alwaysExpanded || this.open || this.hovering);
  }

  toggle(): void {
    this.open = !this.open;
  }

  onMouseEnter(): void {
    this.hovering = true;
  }

  onMouseLeave(): void {
    this.hovering = false;
    this.open = false;
  }
}
