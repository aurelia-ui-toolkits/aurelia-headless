import { bindable, customElement } from 'aurelia';
import { booleanAttr } from '../base/boolean-attr';
import { Keys } from '../base/keys';
import template from './ui-disclosure.html?raw';

let nextPanelId = 0;

@customElement({ name: 'ui-disclosure', template })
export class UiDisclosure {
  @bindable({ set: booleanAttr })
  open: boolean = false;
  panelId: string = '';
  hover: boolean = false;
  focus: boolean = false;
  active: boolean = false;

  binding(): void {
    if (!this.panelId) {
      nextPanelId += 1;
      this.panelId = `ui-disclosure-panel-${nextPanelId}`;
    }
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    this.toggle();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === Keys.Space || event.key === Keys.Enter) {
      event.preventDefault();
      event.stopPropagation();
      this.toggle();
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === Keys.Space) {
      event.preventDefault();
    }
  }

  onMouseEnter(): void {
    this.hover = true;
  }

  onMouseLeave(): void {
    this.hover = false;
  }

  onFocusIn(): void {
    this.focus = true;
  }

  onFocusOut(): void {
    this.focus = false;
  }

  onPointerDown(): void {
    this.active = true;
  }

  onPointerUp(): void {
    this.active = false;
  }

  onPointerLeave(): void {
    this.active = false;
  }

  private toggle(): void {
    this.open = !this.open;
  }
}
