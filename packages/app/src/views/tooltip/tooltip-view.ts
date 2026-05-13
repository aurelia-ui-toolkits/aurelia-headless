import { customElement } from 'aurelia';
import template from './tooltip-view.html?raw';
import './tooltip-view.css';

@customElement({ name: 'tooltip-view', template })
export class TooltipView {
  dynamicTooltip = 'Tooltip text can be bound.';
}
