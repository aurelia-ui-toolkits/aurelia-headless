import { bindable, customElement, INode, resolve } from 'aurelia';
import template from './ui-disclosure-panel.html?raw';

type DisclosureState = {
  open: boolean;
};

let nextPanelId = 0;

@customElement({ name: 'ui-disclosure-panel', template })
export class UiDisclosurePanel {
  @bindable
  id: string = '';

  open: boolean = false;

  private readonly host = resolve(INode) as HTMLElement;
  private disclosureEl: HTMLElement | null = null;
  private readonly onDisclosureState = (event: Event): void => {
    const state = (event as CustomEvent<DisclosureState>).detail;
    this.open = state.open;
  };

  binding(): void {
    if (!this.id) {
      nextPanelId += 1;
      this.id = `ui-disclosure-panel-${nextPanelId}`;
    }
  }

  attached(): void {
    this.disclosureEl = this.host.closest('ui-disclosure');
    if (!this.disclosureEl) {
      return;
    }

    this.disclosureEl.addEventListener('ui-disclosure-state', this.onDisclosureState as EventListener);
    this.syncFromDisclosure();
    this.host.dispatchEvent(new CustomEvent('ui-disclosure-register-panel', {
      bubbles: true,
      detail: { id: this.id }
    }));
  }

  detaching(): void {
    this.disclosureEl?.removeEventListener('ui-disclosure-state', this.onDisclosureState as EventListener);
  }

  private syncFromDisclosure(): void {
    if (!this.disclosureEl) {
      return;
    }

    this.open = this.disclosureEl.hasAttribute('data-open');
  }
}
