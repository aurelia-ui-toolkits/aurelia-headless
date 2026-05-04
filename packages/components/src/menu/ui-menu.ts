import { bindable, BindingMode, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import template from './ui-menu.html?raw';

type MenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

@customElement({ name: 'ui-menu', template })
export class UiMenu {
  readonly element = resolve(INode) as HTMLElement;

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  open: boolean = false;

  @bindable
  anchor: Element | undefined;

  @bindable
  placement: MenuPlacement = 'bottom-start';

  @bindable
  offset: number = 6;

  @bindable
  portalTarget: string | Element | null | undefined;

  @bindable
  portalPosition: InsertPosition = 'beforeend';

  @bindable({ set: booleanAttr })
  closeOnOutside: boolean = true;

  @bindable({ set: booleanAttr })
  closeOnEscape: boolean = true;

  @bindable({ set: booleanAttr })
  matchAnchorWidth: boolean = false;

  @bindable({ set: booleanAttr })
  closeOnSelect: boolean = true;

  onListSelect(event: Event): void {
    this.element.dispatchEvent(new CustomEvent('menu-select', {
      bubbles: true,
      detail: (event as CustomEvent).detail
    }));

    if (this.closeOnSelect) {
      this.open = false;
    }
  }
}
