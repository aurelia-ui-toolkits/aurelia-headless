import { customElement } from 'aurelia';
import template from './popup-view.html?raw';

@customElement({ name: 'popup-view', template })
export class PopupView {
  basicOpen = false;
  inlineOpen = false;

  inlineTarget: Element | null = null;
}
