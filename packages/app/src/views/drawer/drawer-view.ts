import { customElement } from 'aurelia';
import template from './drawer-view.html?raw';
import './drawer-view.css';

@customElement({ name: 'drawer-view', template })
export class DrawerView {
  rightOpen = false;
  leftOpen = false;
  bottomOpen = false;
  owner = '';
  selectedStatusId = 'open';

  readonly statuses = [
    { id: 'open', name: 'Open' },
    { id: 'closed', name: 'Closed' },
    { id: 'archived', name: 'Archived' }
  ];
  selectedStatus = this.statuses[0];

  rightTrigger: HTMLElement | undefined;
  leftTrigger: HTMLElement | undefined;
  bottomTrigger: HTMLElement | undefined;
}
