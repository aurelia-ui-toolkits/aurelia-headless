import { bindable, BindingMode, CustomElement, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import { UiList } from '../list/ui-list';
import { UiPopup } from '../popup/ui-popup';

type MenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'right-start' | 'right-end' | 'left-start' | 'left-end';

@customElement('ui-menu')
export class UiMenu {
  readonly element = resolve(INode) as HTMLElement;
  readonly slotHost = this;
  popup!: UiPopup;

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  open: boolean = false;

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

  onListAction(): void {
    // Non-selectable (action) item activated — close like a selection would, unless opted out.
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

  onPopupOpened(): void {
    this.element.dispatchEvent(new CustomEvent('menu-opened', { bubbles: true }));

    if (!this.focusOnOpen) {
      return;
    }

    setTimeout(() => this.focus(undefined), 0);
  }

  /** The slotted ui-list view-model, if the popup is rendered. */
  get list(): UiList | undefined {
    const el = this.popup?.panelElement?.querySelector('ui-list');
    return el ? CustomElement.for<UiList>(el).viewModel : undefined;
  }

  focus(key: Keys.Home | Keys.End | undefined): void {
    const listViewModel = this.list;
    if (!listViewModel) {
      this.popup.focus();
      return;
    }

    switch (key) {
      case Keys.End:
        listViewModel.focusLast();
        break;
      case Keys.Home:
        listViewModel.focusFirst();
        break;
      default:
        listViewModel.focusSelected();
        break;
    }
  }

  contains(target: Node): boolean {
    return this.popup.contains(target);
  }
}
