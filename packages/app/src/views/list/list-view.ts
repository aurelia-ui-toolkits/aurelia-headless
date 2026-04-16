import { customElement } from 'aurelia';
import template from './list-view.html?raw';

type ListDemoItem = {
  id: number;
  label: string;
  category: string;
  active: boolean;
  selected: boolean;
  disabled?: boolean;
};

@customElement({ name: 'list-view', template })
export class ListView {
  selectedItem: ListDemoItem | undefined;

  readonly staticList: ListDemoItem[] = [
    { id: 1, label: 'Dashboard', category: 'General', active: false, selected: false },
    { id: 2, label: 'Billing', category: 'General', active: false, selected: false },
    { id: 3, label: 'Audit logs', category: 'Security', active: false, selected: false, disabled: true },
    { id: 4, label: 'Integrations', category: 'Settings', active: false, selected: true }
  ];

  readonly virtualList: ListDemoItem[] = Array.from({ length: 40 }, (_, index) => ({
    id: index + 1,
    label: `Dataset ${index + 1}`,
    category: index % 2 === 0 ? 'Primary' : 'Secondary',
    active: false,
    selected: false,
    disabled: (index + 1) % 9 === 0
  }));

  onListActivate(): void {}

  onListSelect(): void {}
}
