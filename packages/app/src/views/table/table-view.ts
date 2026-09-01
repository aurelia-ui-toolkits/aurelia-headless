import { observable } from 'aurelia';
import { IReorderDetail, UiTable } from '@aurelia-ui-toolkits/headless';

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

type BenchRow = {
  id: number;
  name: string;
  status: string;
  owner: string;
  flag: boolean;
};

export class TableView {
  @observable
  sort: TableSort[] = [];
  sortChanged(): void {
    this.showProgress();
    this.page = 1;
    this.refreshRows();
  }

  @observable
  page = 1;
  pageChanged(): void {
    this.refreshRows();
  }

  @observable
  pageSize = 5;
  pageSizeChanged(): void {
    this.page = 1;
    this.refreshRows();
  }

  total = 0;
  tableLoading = false;
  columnOrder: string[] = [];
  hiddenColumns: string[] = [];
  allVisibleSelected = false;
  someVisibleSelected = false;
  pageRows: ProjectRow[] = [];

  private loadingTimeout: ReturnType<typeof setTimeout> | undefined;

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

  detaching(): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
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
    if (this.sort.length) {
      rows.sort((a, b) => {
        for (const { column, direction } of this.sort) {
          const left = String(a[column as keyof ProjectRow] ?? '');
          const right = String(b[column as keyof ProjectRow] ?? '');
          const result = left.localeCompare(right);
          if (result !== 0) {
            return direction === 'asc' ? result : -result;
          }
        }
        return 0;
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

  private showProgress(): void {
    this.tableLoading = true;
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }

    this.loadingTimeout = setTimeout(() => {
      this.tableLoading = false;
      this.loadingTimeout = undefined;
    }, 2000);
  }


  reorderRows = Array.from({ length: 6 }, (_, index) => ({
    id: `row-${index + 1}`,
    name: `Task ${index + 1}`,
    status: index % 2 === 0 ? 'Active' : 'Paused',
    owner: ['Dana', 'Lee', 'Kim'][index % 3],
    selected: false
  }));
  reorderSelection: unknown[] = [];

  toggleReorderSelected(row: { selected: boolean }): void {
    row.selected = !row.selected;
    this.reorderSelection = this.reorderRows.filter(x => x.selected);
  }

  applyReorder(list: unknown[], detail: IReorderDetail): void {
    if (detail.from) {
      [...detail.from].sort((a, b) => b - a).forEach(index => list.splice(index, 1));
    }
    if (detail.to !== undefined) {
      list.splice(detail.to, 0, ...detail.items);
    }
  }

  benchTable!: UiTable;
  benchRows: BenchRow[] = [];
  benchResults: string[] = [];
  virtualRows: BenchRow[] = Array.from({ length: 5000 }, (_, index) => this.makeBenchRow(index));

  benchPopulate(count: number): void {
    this.benchRows = Array.from({ length: count }, (_, index) => this.makeBenchRow(index));
    this.benchLog(`populated ${count} rows`);
  }

  /** Drop cost: moveColumn permutes the cells of every rendered row synchronously. */
  benchMove(): void {
    if (!this.benchRows.length) {
      this.benchPopulate(2000);
    }
    const start = performance.now();
    this.benchTable.moveColumn(1, 3);
    this.benchLog(`moveColumn over ${this.benchRows.length} rows: ${(performance.now() - start).toFixed(1)} ms`);
  }

  /**
   * Row churn cost with an active order: fresh object identities force the repeater to
   * recreate every row; the observer then re-applies the permutation to each. The await
   * lands after the observer's microtask, so its work is included.
   */
  async benchRerender(): Promise<void> {
    if (!this.benchRows.length) {
      return;
    }
    const start = performance.now();
    this.benchRows = this.benchRows.map(row => ({ ...row }));
    await Promise.resolve();
    this.benchLog(`re-render ${this.benchRows.length} rows: ${(performance.now() - start).toFixed(1)} ms (includes observer re-apply)`);
  }

  /**
   * Observer discard-path cost: toggling if.bind content inside cells fires childList
   * records the observer must inspect and ignore. Compare ms/tick with a moved column
   * (observer active) against after "Reset order" (observer disconnected).
   */
  async benchChurn(): Promise<void> {
    if (!this.benchRows.length) {
      return;
    }
    const ticks = 30;
    const start = performance.now();
    for (let tick = 0; tick < ticks; tick++) {
      for (let index = 0; index < this.benchRows.length; index += 4) {
        this.benchRows[index].flag = !this.benchRows[index].flag;
      }
      await new Promise(resolve => setTimeout(resolve));
    }
    const perTick = (performance.now() - start) / ticks;
    this.benchLog(`churn ${Math.ceil(this.benchRows.length / 4)} cell toggles/tick: ${perTick.toFixed(2)} ms/tick`);
  }

  benchResetOrder(): void {
    this.benchTable.resetColumnOrder();
    this.benchLog('order reset (layout observer disconnected)');
  }

  private makeBenchRow(index: number): BenchRow {
    return {
      id: index + 1,
      name: `Row ${index + 1}`,
      status: index % 2 === 0 ? 'Open' : 'Closed',
      owner: ['Avery', 'Blake', 'Casey'][index % 3],
      flag: index % 4 === 0
    };
  }

  private benchLog(line: string): void {
    this.benchResults = [`${new Date().toLocaleTimeString()} — ${line}`, ...this.benchResults].slice(0, 8);
  }
}
