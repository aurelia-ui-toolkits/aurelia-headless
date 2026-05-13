import { customElement } from 'aurelia';
import template from './tabs-view.html?raw';
import './tabs-view.css';

@customElement({ name: 'tabs-view', template })
export class TabsView {
  selectedTab = 'overview';
  compactTab: string | undefined;
}
