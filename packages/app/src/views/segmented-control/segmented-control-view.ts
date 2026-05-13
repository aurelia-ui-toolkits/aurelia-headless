import { customElement } from 'aurelia';
import template from './segmented-control-view.html?raw';
import './segmented-control-view.css';

@customElement({ name: 'segmented-control-view', template })
export class SegmentedControlView {
  view = 'list';
  density = 'comfortable';
}
