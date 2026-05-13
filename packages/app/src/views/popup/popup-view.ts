import { customElement } from 'aurelia';
import template from './popup-view.html?raw';
import './popup-view.css';

@customElement({ name: 'popup-view', template })
export class PopupView {
  basicOpen = false;
  inlineOpen = false;

  basicAnchor: Element | undefined;
  inlineAnchor: Element | undefined;
  inlineTarget: Element | undefined;
}
