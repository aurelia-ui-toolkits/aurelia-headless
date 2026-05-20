type MenuAction = {
  id: string;
  label: string;
  hint: string;
  disabled?: boolean;
};

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
