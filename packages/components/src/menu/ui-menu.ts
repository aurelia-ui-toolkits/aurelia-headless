import { bindable, BindingMode, CustomElement, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import { UiList } from '../list/ui-list';
import { UiPopup } from '../popup/ui-popup';
import template from './ui-menu.html?raw';

type MenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

@customElement({ name: 'ui-menu', template })
export class UiMenu {
  readonly element = resolve(INode) as HTMLElement;
  readonly slotHost = this;
  popup!: UiPopup;

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  open: boolean = false;
  openChanged(newValue: boolean): void {
    if (newValue && this.focusOnOpen) {
      this.focus();
    }
  }

  @bindable
  anchor: Element | undefined;

  @bindable
  tabReference: HTMLElement | undefined;

  @bindable
  placement: MenuPlacement = 'bottom-start';

  @bindable
  offset: number = 6;

  @bindable
  portalTarget: string | Element | null | undefined;

  @bindable
  portalPosition: InsertPosition = 'beforeend';

  @bindable
  exposedHost: unknown;

  @bindable({ set: booleanAttr })
  closeOnOutside: boolean = true;

  @bindable({ set: booleanAttr })
  closeOnEscape: boolean = true;

  @bindable({ set: booleanAttr })
  matchAnchorWidth: boolean = false;

  @bindable({ set: booleanAttr })
  focusOnOpen: boolean = true;

  @bindable({ set: booleanAttr })
  restoreFocus: boolean = true;

  @bindable({ set: booleanAttr })
  closeOnSelect: boolean = true;

  get effectiveSlotHost(): unknown {
    return this.exposedHost ?? this.slotHost;
  }

  onListSelect(event: Event): void {
    this.element.dispatchEvent(new CustomEvent('menu-select', {
      bubbles: true,
      detail: (event as CustomEvent).detail
    }));

    if (this.closeOnSelect) {
      this.open = false;
    }
  }

  onPopupTabAway(event: CustomEvent): void {
    this.element.dispatchEvent(new CustomEvent('menu-tab-away', {
      bubbles: true,
      detail: event.detail
    }));
  }

  focus(key: Keys.Home | Keys.End = Keys.Home): void {
    const list = this.popup.panelElement?.querySelector('ui-list') as HTMLElement | null;
    if (!list) {
      this.popup.focus();
      return;
    }

    const listViewModel = CustomElement.for<UiList>(list).viewModel;
    if (key === Keys.End) {
      listViewModel.focusLast();
    } else {
      listViewModel.focusFirst();
    }
  }

  contains(target: Node): boolean {
    return this.popup.contains(target);
  }
}
