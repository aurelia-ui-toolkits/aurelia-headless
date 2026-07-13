import { bindable, BindingMode, children, customElement, INode, resolve } from 'aurelia';
import { Keys } from '../base/keys';
import { UiTab } from './ui-tab';
import { booleanAttr } from '../base/boolean-attr';

@customElement('ui-tabs')
export class UiTabs {
  private readonly element = resolve(INode) as HTMLElement;

  @bindable({ mode: BindingMode.twoWay })
  value: unknown;

  @bindable({ mode: BindingMode.twoWay, set: booleanAttr })
  externalValue: unknown;

  @children({
    query: '.ui-tab',
    map: (_node, viewModel) => viewModel
  })
  tabs: UiTab[] = [];
  tabsChanged(): void {
    this.selectInitialTab();
  }

  attached(): void {
    this.selectInitialTab();
  }

  select(value: unknown): void {
    if (this.externalValue || this.value === value) {
      return;
    }

    this.value = value;
    this.dispatchValueEvent('input');
    this.dispatchValueEvent('change');
  }

  isSelected(tab: UiTab): boolean {
    return this.value === tab.value;
  }

  /**
   * Whether `tab` should be the tablist's single Tab stop (roving tabindex). Normally that's the
   * selected tab, but when `value` matches no tab (e.g. an out-of-range bound value) fall back to
   * the first enabled tab so the tablist never becomes keyboard-unreachable.
   */
  isTabbable(tab: UiTab): boolean {
    if (tab.disabled) {
      return false;
    }

    if (this.isSelected(tab)) {
      return true;
    }

    const enabled = this.enabledTabs;
    return !enabled.some(candidate => this.isSelected(candidate)) && enabled[0] === tab;
  }

  onKeyDown(event: KeyboardEvent): void {
    const tabs = this.enabledTabs;
    if (!tabs.length) {
      return;
    }

    if (event.key === Keys.Home) {
      event.preventDefault();
      this.focusTab(tabs[0]);
      return;
    }

    if (event.key === Keys.End) {
      event.preventDefault();
      this.focusTab(tabs[tabs.length - 1]);
      return;
    }

    const direction = this.getNavigationDirection(event.key);
    if (!direction) {
      return;
    }

    event.preventDefault();
    const active = this.tabs.find(tab => tab.element === document.activeElement) ?? this.tabs.find(tab => this.isSelected(tab));
    const index = active ? tabs.indexOf(active) : -1;
    const next = tabs[(index + direction + tabs.length) % tabs.length];
    this.focusTab(next);
  }

  private get enabledTabs(): UiTab[] {
    return this.tabs.filter(tab => !tab.disabled);
  }

  private selectInitialTab(): void {
    if (this.value !== undefined || !this.tabs.length) {
      return;
    }

    const first = this.enabledTabs[0];
    if (first) {
      this.value = first.value;
    }
  }

  private focusTab(tab: UiTab): void {
    this.select(tab.value);
    tab.element.focus();
  }

  private getNavigationDirection(key: string): 1 | -1 | undefined {
    if (key === Keys.ArrowRight || key === Keys.ArrowDown) {
      return 1;
    }

    if (key === Keys.ArrowLeft || key === Keys.ArrowUp) {
      return -1;
    }

    return undefined;
  }

  private dispatchValueEvent(type: 'input' | 'change'): void {
    this.element.dispatchEvent(new Event(type, { bubbles: true }));
  }
}
