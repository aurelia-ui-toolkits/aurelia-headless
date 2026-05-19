import { customElement } from 'aurelia';
import { UiBreadcrumbItem } from '@aurelia-ui-toolkits/headless';
import template from './top-app-bar-view.html?raw';
import './top-app-bar-view.css';

@customElement({ name: 'top-app-bar-view', template })
export class TopAppBarView {
  breadcrumbs: UiBreadcrumbItem[] = [
    { label: 'Components', href: '#/' },
    { label: 'Navigation', href: '#/top-app-bar' },
    { label: 'ui-top-app-bar', current: true }
  ];
}
