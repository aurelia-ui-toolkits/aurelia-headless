import type { UiMenu } from '@aurelia-ui-toolkits/headless';

type MenuAction = {
  id: string;
  label: string;
  hint: string;
  disabled?: boolean;
};

export class MenuView {
  open = false;
  anchor: Element | undefined;
  contextMenu: UiMenu | undefined;
  selectedAction: MenuAction | undefined;
  selectedContextAction: MenuAction | undefined;

  readonly actions: MenuAction[] = [
    { id: 'rename', label: 'Rename', hint: 'R' },
    { id: 'duplicate', label: 'Duplicate', hint: 'D' },
    { id: 'archive', label: 'Archive', hint: 'A', disabled: true },
    { id: 'delete', label: 'Delete', hint: 'Del' }
  ];

  readonly contextActions: MenuAction[] = [
    { id: 'open', label: 'Open', hint: 'Enter' },
    { id: 'copy-link', label: 'Copy link', hint: 'Ctrl+C' },
    { id: 'move', label: 'Move to', hint: 'M' },
    { id: 'remove', label: 'Remove', hint: 'Del' }
  ];

  onMenuSelect(event: CustomEvent<MenuAction>): void {
    this.selectedAction = event.detail;
  }

  onContextMenuSelect(event: CustomEvent<MenuAction>): void {
    this.selectedContextAction = event.detail;
  }
}
