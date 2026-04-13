import { bindable, customElement, INode, resolve } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import template from './ui-disclosure.html?raw';

type DisclosureState = {
  open: boolean;
  buttonId: string | null;
  panelId: string | null;
};

@customElement({ name: 'ui-disclosure', template })
export class UiDisclosure {
  @bindable({ set: booleanAttr })
  defaultOpen: boolean = false;

  open: boolean = false;
  buttonId: string | null = null;
  panelId: string | null = null;

  private readonly host = resolve(INode) as HTMLElement;

  binding(): void {
    this.open = this.defaultOpen;
  }

  attached(): void {
    this.publishState();
  }

  onToggle(event: Event): void {
    event.stopPropagation();
    this.open = !this.open;
    this.publishState();
  }

  onClose(event: Event): void {
    event.stopPropagation();
    if (this.open) {
      this.open = false;
      this.publishState();
    }
  }

  onRegisterButton(event: CustomEvent<{ id?: string }>): void {
    event.stopPropagation();
    this.buttonId = event.detail?.id ?? null;
    this.publishState();
  }

  onRegisterPanel(event: CustomEvent<{ id?: string }>): void {
    event.stopPropagation();
    this.panelId = event.detail?.id ?? null;
    this.publishState();
  }

  close(): void {
    if (this.open) {
      this.open = false;
      this.publishState();
    }
  }

  private publishState(): void {
    this.host.dispatchEvent(new CustomEvent<DisclosureState>('ui-disclosure-state', {
      detail: {
        open: this.open,
        buttonId: this.buttonId,
        panelId: this.panelId
      }
    }));
  }
}
