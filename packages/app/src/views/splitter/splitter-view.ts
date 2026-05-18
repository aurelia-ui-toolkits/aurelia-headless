import { customElement } from 'aurelia';
import template from './splitter-view.html?raw';
import './splitter-view.css';

@customElement({ name: 'splitter-view', template })
export class SplitterView {
  leftSize = 220;
  topSize = 160;
  nestedSize = 260;
}
