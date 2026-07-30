import { bindable, customElement, INode, resolve, slotted } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { UiList } from './ui-list';

@customElement('ui-list-item')
export class UiListItem {

  readonly element = resolve(INode) as HTMLElement;
  readonly parentList = resolve(UiList);
  readonly slotHost = this;

  @slotted({ slotName: 'leading' })
  leadingNodes: readonly Node[] = [];

  @slotted({ slotName: 'secondary' })
  secondaryNodes: readonly Node[] = [];

  @slotted({ slotName: 'trailing' })
  trailingNodes: readonly Node[] = [];

  get hasSecondary(): boolean {
    return this.secondaryNodes.length > 0;
  }

  @bindable
  value: object = this;
  valueChanged(): void {
    this.selected = this.parentList.isItemSelected(this.value);
  }

  selected: boolean = false;

  /**
   * Dataset index used by reordering. Defaults to the repeat's $index in a reorderable list
   * (see EnhanceUiList); set explicitly when $index is not the dataset index (a windowed
   * repeat with window-relative indexes: `index.bind="$index + firstVisibleIndex"`).
   */
  @bindable
  index: number | undefined;

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  @bindable({ set: booleanAttr })
  nonSelectable: boolean = false;

  /** When set, the secondary slot renders above the primary slot as a small overline label. */
  @bindable({ set: booleanAttr })
  reverse: boolean = false;

  /**
   * The router's load/href attributes assign the resolved URL to the view model when their host
   * is a custom element; reflect it onto the host so <a as-element="ui-list-item"> gets a real
   * href (open-in-new-tab, copy link, etc.).
   */
  get href(): string | null {
    return this.element.getAttribute('href');
  }
  set href(value: string | null) {
    if (value == null) {
      this.element.removeAttribute('href');
    } else {
      this.element.setAttribute('href', value);
    }
  }
}
