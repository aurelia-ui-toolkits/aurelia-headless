import { customElement, observable } from 'aurelia';
import template from './table-view.html?raw';
import './table-view.css';

type SortDirection = 'asc' | 'desc';

type TableSort = {
  column: string;
  direction: SortDirection;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  owner: string;
  selected: boolean;
};

@customElement({ name: 'table-view', template })
export class TableView {
  @observable
  sort: TableSort | undefined;

  nameDirection: SortDirection | undefined;
  statusDirection: SortDirection | undefined;
  ownerDirection: SortDirection | undefined;

  @observable
  page = 1;

  @observable
  pageSize = 5;

  total = 0;
  allVisibleSelected = false;
  someVisibleSelected = false;
  pageRows: ProjectRow[] = [];

  readonly pageSizeOptions = [5, 10, 20];
  readonly projects: ProjectRow[] = [
    { id: 'aurora', name: 'Aurora', status: 'Open', owner: 'Avery', selected: false },
    { id: 'borealis', name: 'Borealis', status: 'Closed', owner: 'Blake', selected: false },
    { id: 'calypso', name: 'Calypso', status: 'Open', owner: 'Casey', selected: false },
    { id: 'delta', name: 'Delta', status: 'Archived', owner: 'Devon', selected: false },
    { id: 'ember', name: 'Ember', status: 'Open', owner: 'Ellis', selected: false },
    { id: 'fable', name: 'Fable', status: 'Closed', owner: 'Finley', selected: false },
    { id: 'gemini', name: 'Gemini', status: 'Open', owner: 'Gray', selected: false },
    { id: 'helios', name: 'Helios', status: 'Archived', owner: 'Harper', selected: false },
    { id: 'ion', name: 'Ion', status: 'Open', owner: 'Indigo', selected: false },
    { id: 'juno', name: 'Juno', status: 'Closed', owner: 'Jules', selected: false },
    { id: 'kepler', name: 'Kepler', status: 'Open', owner: 'Kai', selected: false },
    { id: 'lumen', name: 'Lumen', status: 'Open', owner: 'Logan', selected: false }
  ];

  binding(): void {
    this.refreshRows();
  }

  sortChanged(): void {
    this.nameDirection = this.sort?.column === 'name' ? this.sort.direction : undefined;
    this.statusDirection = this.sort?.column === 'status' ? this.sort.direction : undefined;
    this.ownerDirection = this.sort?.column === 'owner' ? this.sort.direction : undefined;
    this.page = 1;
    this.refreshRows();
  }

  pageChanged(): void {
    this.refreshRows();
  }

  pageSizeChanged(): void {
    this.page = 1;
    this.refreshRows();
  }

  toggleSelected(row: ProjectRow): void {
    row.selected = !row.selected;
    this.updateSelectionState();
  }

  toggleVisibleSelection(): void {
    const selected = !this.allVisibleSelected;
    for (const row of this.pageRows) {
      row.selected = selected;
    }
    this.updateSelectionState();
  }

  private refreshRows(): void {
    const rows = [...this.projects];
    if (this.sort) {
      const { column, direction } = this.sort;
      rows.sort((a, b) => {
        const left = String(a[column as keyof ProjectRow] ?? '');
        const right = String(b[column as keyof ProjectRow] ?? '');
        return direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
      });
    }

    this.total = rows.length;
    const start = (this.page - 1) * this.pageSize;
    this.pageRows = rows.slice(start, start + this.pageSize);
    this.updateSelectionState();
  }

  private updateSelectionState(): void {
    const selectedCount = this.pageRows.filter(row => row.selected).length;
    this.allVisibleSelected = this.pageRows.length > 0 && selectedCount === this.pageRows.length;
    this.someVisibleSelected = selectedCount > 0 && selectedCount < this.pageRows.length;
  }
}
