import { customElement } from 'aurelia';
import template from './menu-view.html?raw';
import './menu-view.css';

type MenuAction = {
  id: string;
  label: string;
  hint: string;
  disabled?: boolean;
};

@customElement({ name: 'menu-view', template })
export class MenuView {
  open = false;
  anchor: Element | undefined;
  selectedAction: MenuAction | undefined;

  readonly actions: MenuAction[] = [
    { id: 'rename', label: 'Rename', hint: 'R' },
    { id: 'duplicate', label: 'Duplicate', hint: 'D' },
    { id: 'archive', label: 'Archive', hint: 'A', disabled: true },
    { id: 'delete', label: 'Delete', hint: 'Del' }
  ];

  onMenuSelect(event: CustomEvent<MenuAction>): void {
    this.selectedAction = event.detail;
  }
}
