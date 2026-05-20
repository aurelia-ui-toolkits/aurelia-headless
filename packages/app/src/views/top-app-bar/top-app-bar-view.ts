import { UiBreadcrumbItem } from '@aurelia-ui-toolkits/headless';

export class TopAppBarView {
  breadcrumbs: UiBreadcrumbItem[] = [
    { label: 'Components', href: '#/' },
    { label: 'Navigation', href: '#/top-app-bar' },
    { label: 'ui-top-app-bar', current: true }
  ];
}
