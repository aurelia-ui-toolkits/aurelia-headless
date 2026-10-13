import { describe, expect, it, vi } from 'vitest';
import { key, settle } from './fixture';
import { dispatch, mount, UI, viewModel } from './library-fixture';

async function tableFixture() {
  const f = await mount(`<ui-table total.bind="total" page.bind="page" page-size.bind="pageSize" sort.bind="sort" storage-key="test-table" items.bind="items">
    <table><thead><tr><th ui-table-column="name" sortable hideable>Name</th><th ui-table-column="score" sortable hideable>Score</th></tr></thead>
    <tbody><tr repeat.for="item of items"><td textcontent.bind="item.name"></td><td textcontent.bind="item.score"></td></tr></tbody></table>
  </ui-table>`, { total: 45, page: 1, pageSize: 10, sort: [] as { column: string; direction: 'asc' | 'desc' }[], items: [{ name: 'Alpha', score: 1 }, { name: 'Beta', score: 2 }] });
  return { ...f, vm: viewModel<UI.UiTable>(f.getBy('ui-table')!) };
}

describe('ui-table and ui-table-column', () => {
  it('bounds pagination and resets the page after a page-size change', async () => {
    const f = await tableFixture();
    expect(f.vm.totalPages).toBe(5);
    f.getBy<HTMLButtonElement>('[aria-label="Next page"]')!.click();
    await settle();
    expect(f.component.page).toBe(2);
    f.vm.lastPage();
    await settle();
    expect(f.component.page).toBe(5);
    f.vm.nextPage();
    expect(f.vm.page).toBe(5);
    f.vm.setPageSize(25);
    await settle();
    expect(f.component.page).toBe(1);
    expect(f.component.pageSize).toBe(25);
    expect(f.vm.totalPages).toBe(2);
    f.component.total = 0;
    await settle();
    expect(f.vm.pageOptions).toEqual([1]);
  });

  it('cycles sort direction, supports multi-sort and updates aria-sort', async () => {
    const f = await tableFixture();
    const name = f.getBy<HTMLElement>('#name')!;
    const score = f.getBy<HTMLElement>('#score')!;
    name.click();
    await settle();
    expect(f.component.sort).toEqual([{ column: 'name', direction: 'asc' }]);
    expect(name.getAttribute('aria-sort')).toBe('ascending');
    dispatch(score, 'click', { ctrlKey: true });
    await settle();
    expect(f.component.sort).toEqual([{ column: 'name', direction: 'asc' }, { column: 'score', direction: 'asc' }]);
    name.click();
    await settle();
    expect(f.component.sort).toEqual([{ column: 'name', direction: 'desc' }]);
    name.click();
    await settle();
    expect(f.component.sort).toEqual([]);
  });

  it('reorders all rows, persists widths/visibility, protects the last column and resets', async () => {
    localStorage.removeItem('ui-table:test-table');
    const f = await tableFixture();
    const reordered = vi.fn();
    f.appHost.addEventListener('column-reorder', reordered);
    f.vm.moveColumn(0, 2);
    await settle();
    expect(f.vm.headerCells().map(cell => cell.id)).toEqual(['score', 'name']);
    expect(f.getAllBy('tbody tr')[0].textContent?.replace(/\s/g, '')).toBe('1Alpha');
    expect(reordered).toHaveBeenCalledTimes(1);
    f.vm.setColumnWidth('name', 123.6, true);
    f.vm.toggleColumn('name');
    await settle();
    expect(f.vm.hiddenColumnKeys).toEqual(['name']);
    expect(JSON.parse(localStorage.getItem('ui-table:test-table')!).widths).toEqual({ name: 124 });
    f.vm.toggleColumn('score');
    expect(f.vm.hiddenColumnKeys).toEqual(['name']);
    f.vm.resetColumns();
    await settle();
    expect(f.vm.headerCells().map(cell => cell.id)).toEqual(['name', 'score']);
    expect(f.vm.hiddenColumnKeys).toEqual([]);
    expect(f.vm.columnWidths).toEqual([]);
    expect(localStorage.getItem('ui-table:test-table')).toBeNull();
  });
});

describe('ui-tree', () => {
  const items = [
    { value: 'parent', label: 'Parent', children: [{ value: 'child', label: 'Child' }] },
    { value: 'blocked', label: 'Blocked', disabled: true },
    { value: 'last', label: 'Last' },
  ];
  it('expands, navigates hierarchy, selects and collapses with accessible levels', async () => {
    const f = await mount('<ui-tree items.bind="items" value.bind="value" label="Files"></ui-tree>', { items, value: undefined as unknown });
    const host = f.getBy<HTMLElement>('ui-tree')!;
    const vm = viewModel<UI.UiTree>(host);
    const selected = vi.fn();
    host.addEventListener('tree-select', selected);
    host.focus();
    await key(host, 'ArrowRight');
    expect(vm.visibleRows.map(row => row.value)).toEqual(['parent', 'child', 'blocked', 'last']);
    expect(f.getAllBy('[role="treeitem"]')[1].getAttribute('aria-level')).toBe('2');
    await key(host, 'ArrowRight');
    expect(vm.activeValue).toBe('child');
    await key(host, 'Enter');
    expect(f.component.value).toBe('child');
    expect((selected.mock.calls[0][0] as CustomEvent).detail).toBe(items[0].children![0]);
    await key(host, 'ArrowLeft');
    expect(vm.activeValue).toBe('parent');
    await key(host, 'ArrowLeft');
    expect(vm.visibleRows).toHaveLength(3);
    await key(host, 'ArrowDown');
    expect(vm.activeValue).toBe('last');
  });

  it.each(['disabled', 'selection-mode="none"'])('does not select when %s', async attribute => {
    const f = await mount(`<ui-tree items.bind="items" value.bind="value" ${attribute}></ui-tree>`, { items, value: undefined as unknown });
    f.getAllBy<HTMLElement>('[role="treeitem"]')[0].click();
    await settle();
    expect(f.component.value).toBeUndefined();
  });
});

describe('ui-list and ui-list-item', () => {
  it('selects, skips disabled options and wraps keyboard navigation', async () => {
    const f = await mount('<ui-list selected.bind="selected"><ui-list-item value="a">A</ui-list-item><ui-list-item value="b" disabled>B</ui-list-item><ui-list-item value="c">C</ui-list-item></ui-list>', { selected: undefined as unknown });
    const host = f.getBy<HTMLElement>('ui-list')!;
    const vm = viewModel<UI.UiList>(host);
    await key(host, 'Home');
    expect(vm.activeItem).toBe('a');
    await key(host, 'ArrowDown');
    expect(vm.activeItem).toBe('c');
    await key(host, 'Enter');
    expect(f.component.selected).toBe('c');
    expect(f.getAllBy('ui-list-item')[2].getAttribute('aria-selected')).toBe('true');
    await key(host, 'ArrowDown');
    expect(vm.activeItem).toBe('a');
  });

  it('derives static values and emits actions for non-selectable rows', async () => {
    const f = await mount('<ui-list><ui-list-item value="a">A</ui-list-item><ui-list-item non-selectable>Action</ui-list-item></ui-list>', {});
    const action = vi.fn();
    f.appHost.addEventListener('list-action', action);
    f.getAllBy<HTMLElement>('ui-list-item')[1].click();
    await settle();
    expect(action).toHaveBeenCalledTimes(1);
    expect(viewModel<UI.UiList>(f.getBy('ui-list')!).items).toHaveLength(2);
  });
});
