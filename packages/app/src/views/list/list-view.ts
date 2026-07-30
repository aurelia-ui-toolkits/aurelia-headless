import { IReorderDetail } from '@aurelia-ui-toolkits/headless';

type ListDemoItem = {
  id: number;
  label: string;
  category: string;
  active: boolean;
  selected: boolean;
  disabled?: boolean;
};

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

  reorderList: ListDemoItem[] = Array.from({ length: 8 }, (_, index) => ({
    id: index + 1, label: `Step ${index + 1}`, category: 'Pipeline', active: false, selected: false
  }));

  multiReorderList: ListDemoItem[] = Array.from({ length: 8 }, (_, index) => ({
    id: index + 1, label: `Track ${index + 1}`, category: 'Playlist', active: false, selected: false
  }));
  multiReorderSelection: ListDemoItem[] = [];

  handleReorderList: ListDemoItem[] = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1, label: `Layer ${index + 1}`, category: 'Canvas', active: false, selected: false
  }));

  poolA: ListDemoItem[] = Array.from({ length: 5 }, (_, index) => ({
    id: index + 1, label: `Backlog ${index + 1}`, category: 'Backlog', active: false, selected: false
  }));
  poolB: ListDemoItem[] = Array.from({ length: 5 }, (_, index) => ({
    id: index + 100, label: `Sprint ${index + 1}`, category: 'Sprint', active: false, selected: false
  }));

  duplicateValuesList: string[] = ['Apple', 'Banana', 'Apple', 'Cherry', 'Banana'];

  tallReorderList: ListDemoItem[] = Array.from({ length: 30 }, (_, index) => ({
    id: index + 1, label: `Row ${index + 1}`, category: 'Long list', active: false, selected: false
  }));

  /**
   * Single handler for every reorder intent: `from` only = removal (cross-list source),
   * `to` only = insertion (cross-list target), both = same-list move (`to` pre-adjusted).
   */
  applyReorder(list: unknown[], detail: IReorderDetail): void {
    if (detail.from) {
      [...detail.from].sort((a, b) => b - a).forEach(index => list.splice(index, 1));
    }
    if (detail.to !== undefined) {
      list.splice(detail.to, 0, ...detail.items);
    }
  }
}
