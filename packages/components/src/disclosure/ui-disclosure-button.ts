import { bindable, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import template from './ui-disclosure-button.html?raw';

type DisclosureState = {
  open: boolean;
  panelId: string | null;
};

let nextButtonId = 0;

@customElement({ name: 'ui-disclosure-button', template })
export class UiDisclosureButton {
  @bindable
  id: string = '';

  @bindable({ set: booleanAttr })
  disabled: boolean = false;

  open: boolean = false;
  panelId: string | null = null;
  hover: boolean = false;
  focus: boolean = false;
  active: boolean = false;

  private readonly host = resolve(INode) as HTMLElement;
  private disclosureEl: HTMLElement | null = null;
  private readonly onDisclosureState = (event: Event): void => {
    const state = (event as CustomEvent<DisclosureState>).detail;
    this.open = state.open;
    this.panelId = state.panelId;
  };

  binding(): void {
    if (!this.id) {
      nextButtonId += 1;
      this.id = `ui-disclosure-button-${nextButtonId}`;
    }
  }

  attached(): void {
    this.disclosureEl = this.host.closest('ui-disclosure');
    if (!this.disclosureEl) {
      return;
    }

    this.disclosureEl.addEventListener('ui-disclosure-state', this.onDisclosureState as EventListener);
    this.syncFromDisclosure();
    this.host.dispatchEvent(new CustomEvent('ui-disclosure-register-button', {
      bubbles: true,
      detail: { id: this.id }
    }));
  }

  detaching(): void {
    this.disclosureEl?.removeEventListener('ui-disclosure-state', this.onDisclosureState as EventListener);
  }

  onClick(event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    this.toggleDisclosure();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }

    if (event.key === Keys.Space || event.key === Keys.Enter) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleDisclosure();
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === Keys.Space) {
      event.preventDefault();
    }
  }

  onMouseEnter(): void {
    if (!this.disabled) {
      this.hover = true;
    }
  }

  onMouseLeave(): void {
    this.hover = false;
  }

  onFocusIn(): void {
    if (!this.disabled) {
      this.focus = true;
    }
  }

  onFocusOut(): void {
    this.focus = false;
  }

  onPointerDown(): void {
    if (!this.disabled) {
      this.active = true;
    }
  }

  onPointerUp(): void {
    this.active = false;
  }

  onPointerLeave(): void {
    this.active = false;
  }

  private syncFromDisclosure(): void {
    if (!this.disclosureEl) {
      return;
    }

    this.open = this.disclosureEl.hasAttribute('data-open');
    this.panelId = this.disclosureEl.getAttribute('data-panel-id');
  }

  private toggleDisclosure(): void {
    this.host.dispatchEvent(new CustomEvent('ui-disclosure-toggle', { bubbles: true }));
  }
}
