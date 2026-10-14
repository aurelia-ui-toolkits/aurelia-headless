import { describe, expect, it, vi } from 'vitest';
import { comboboxFixture, key, options, rows, settle, type } from './fixture';

describe('ui-combobox', () => {
  it('resolves a falsy initial value and clears stale labels on unmatched values and resets', async () => {
    const f = await comboboxFixture('', { value: 0 });
    expect(f.input.value).toBe('Alpha');
    expect(f.component.text).toBe('Alpha');
    expect(f.vm.selectedOption).toBe(options[0]);
    f.component.value = 99;
    await settle();
    expect(f.input.value).toBe('');
    expect(f.vm.selectedOption).toBeUndefined();
    f.component.value = 2;
    await settle();
    expect(f.input.value).toBe('Beta');
    f.component.value = undefined;
    await settle();
    expect(f.input.value).toBe('');
    expect(f.vm.filteredItems).toEqual([]);
  });

  it('re-resolves a selected value after replacing the options', async () => {
    const f = await comboboxFixture('', { value: 2, items: [] });
    expect(f.input.value).toBe('');
    f.component.items = options;
    await settle();
    expect(f.input.value).toBe('Beta');
    f.component.items = [{ id: 2, name: 'Renamed', region: 'East' }];
    await settle();
    expect(f.input.value).toBe('Renamed');
  });

  it('treats null as no selection on initialization and external reset', async () => {
    const f = await comboboxFixture('', { value: null });
    expect(f.input.value).toBe('');
    expect(f.vm.selectedOption).toBeUndefined();
    f.component.value = 2;
    await settle();
    expect(f.input.value).toBe('Beta');
    f.component.value = null;
    await settle();
    expect(f.input.value).toBe('');
    expect(f.vm.selectedOption).toBeUndefined();
    expect(f.vm.filteredItems).toEqual([]);
  });

  it('filters case-insensitively with trimmed text and clears the prior selection while typing', async () => {
    const f = await comboboxFixture('', { value: 0 });
    await type(f.input, '  bE  ');
    expect(f.component.value).toBeUndefined();
    expect(f.component.text).toBe('  bE  ');
    expect(f.vm.selectedOption).toBeUndefined();
    expect(f.vm.filteredItems).toEqual([options[2]]);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent?.trim()).toBe('Beta');
    expect(f.input.getAttribute('aria-expanded')).toBe('true');
    await type(f.input, 'no match');
    expect(f.vm.filteredItems).toEqual([]);
    expect(rows()).toHaveLength(0);
    expect(f.input.value).toBe('no match');
    await type(f.input, '');
    expect(f.vm.filteredItems).toEqual(options);
  });

  it('uses filter-field separately from the display label', async () => {
    const f = await comboboxFixture('filter-field="region"');
    await type(f.input, 'east');
    expect(f.vm.filteredItems).toEqual([options[2]]);
    rows()[0].click();
    await settle();
    expect(f.component.value).toBe(2);
    expect(f.input.value).toBe('Beta');
  });

  it('accepts function value and label fields', async () => {
    const f = await comboboxFixture('value-field.bind="getValue" label-field.bind="getLabel"', {
      getValue: (item: typeof options[number]) => item.id,
      getLabel: (item: typeof options[number]) => `${item.name}!`,
      value: 0,
    });
    expect(f.input.value).toBe('Alpha!');
    await type(f.input, 'beta');
    rows()[0].click();
    await settle();
    expect(f.component.value).toBe(2);
    expect(f.input.value).toBe('Beta!');
  });

  it('commits a menu selection, emits form events and keeps focus without reopening', async () => {
    const f = await comboboxFixture('open-on-focus');
    f.input.focus();
    await settle();
    await type(f.input, 'Beta');
    const input = vi.fn();
    const change = vi.fn();
    f.host.addEventListener('input', input);
    f.host.addEventListener('change', change);
    rows()[0].click();
    await settle();
    expect(f.component.value).toBe(2);
    expect(f.component.text).toBe('Beta');
    expect(f.vm.open).toBe(false);
    expect(document.activeElement).toBe(f.input);
    expect(input).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('opens on focus only when open-on-focus is %s', async enabled => {
    const f = await comboboxFixture(enabled ? 'open-on-focus' : '');
    f.input.focus();
    await settle();
    expect(f.vm.open).toBe(enabled);
    expect(f.vm.filteredItems).toEqual(options);
  });

  it.each(['Escape', 'Tab'])('closes on %s while preserving typed text', async closeKey => {
    const f = await comboboxFixture();
    await type(f.input, 'Be');
    const event = await key(f.input, closeKey);
    expect(f.vm.open).toBe(false);
    expect(f.input.value).toBe('Be');
    expect(f.component.value).toBeUndefined();
    expect(event.defaultPrevented).toBe(closeKey === 'Escape');
  });

  it.each([['ArrowDown', 0], ['ArrowUp', 3]] as const)('opens and activates an option with %s', async (openingKey, index) => {
    const f = await comboboxFixture();
    expect((await key(f.input, openingKey)).defaultPrevented).toBe(true);
    expect(f.vm.open).toBe(true);
    expect(f.vm.menu.list?.activeItem).toBe(options[index]);
    await key(document.querySelector<HTMLElement>('ui-list')!, 'Enter');
    expect(f.component.value).toBe(options[index].id);
  });

  it('opens on Ctrl+Space and toggles with the chevron', async () => {
    const f = await comboboxFixture();
    await key(f.input, ' ', { ctrlKey: true });
    expect(f.vm.open).toBe(true);
    const chevron = f.getBy('.ui-combobox__chevron-button')!;
    chevron.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    await settle();
    expect(f.vm.open).toBe(false);
    chevron.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    await settle();
    expect(f.vm.open).toBe(true);
  });

  it.each(['disabled', 'readonly'])('blocks typing, opening and the chevron when %s', async attribute => {
    const f = await comboboxFixture(attribute, { value: 0 });
    await type(f.input, 'Beta');
    await key(f.input, 'ArrowDown');
    await key(f.input, ' ', { ctrlKey: true });
    f.getBy('.ui-combobox__chevron-button')!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await settle();
    expect(f.vm.open).toBe(false);
    expect(f.component.value).toBe(0);
    expect(attribute === 'disabled' ? f.input.disabled : f.input.readOnly).toBe(true);
  });

  it.each([false, true])('commits the first match on blur only when select-on-blur is %s', async enabled => {
    const f = await comboboxFixture(enabled ? 'select-on-blur' : '');
    await type(f.input, 'Be');
    f.input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await settle();
    expect(f.component.value).toBe(enabled ? 2 : undefined);
    expect(f.input.value).toBe(enabled ? 'Beta' : 'Be');
    expect(f.vm.open).toBe(false);
  });

  it('does not commit empty or unmatched text on blur', async () => {
    const f = await comboboxFixture('select-on-blur');
    for (const text of ['   ', 'no match']) {
      await type(f.input, text);
      f.input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      await settle();
      expect(f.component.value).toBeUndefined();
      expect(f.input.value).toBe(text);
    }
  });

  it('does not commit on blur into its popup', async () => {
    const f = await comboboxFixture('select-on-blur');
    await type(f.input, 'Be');
    f.input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: rows()[0] }));
    await settle();
    expect(f.vm.open).toBe(true);
    expect(f.component.value).toBeUndefined();
  });

  it('resolves the initial selection through an asynchronous provider', async () => {
    const provider = vi.fn(async (_filter: string | undefined, value: unknown) =>
      options.filter(item => item.id === value));
    const f = await comboboxFixture('', { items: provider, value: 2 });
    expect(provider).toHaveBeenCalledWith('', 2);
    expect(f.input.value).toBe('Beta');
    expect(f.component.text).toBe('Beta');
    expect(f.vm.selectedOption).toBe(options[2]);
  });

  it.each([null, undefined])('keeps an external %s reset clear after a pending value lookup resolves', async reset => {
    let resolveLookup!: (items: unknown[]) => void;
    const provider = (_filter: string | undefined, value: unknown) =>
      value === 2 ? new Promise<unknown[]>(resolve => { resolveLookup = resolve; }) : [];
    const f = await comboboxFixture('', { items: provider });
    f.component.value = 2;
    await settle();
    f.component.value = reset;
    await settle();
    expect(f.input.value).toBe('');
    resolveLookup([options[2]]);
    await settle();
    expect(f.component.value).toBe(reset);
    expect(f.component.text).toBeUndefined();
    expect(f.input.value).toBe('');
    expect(f.vm.selectedOption).toBeUndefined();
    expect(f.vm.filteredItems).toEqual([]);
  });

  it.each([
    [null, 'Be'], [undefined, 'Be'],
    [null, 'no match'], [undefined, 'no match'],
  ] as const)('preserves typed text after reset %s when a stale value lookup finishes (%s)', async (reset, text) => {
    let resolveLookup!: (items: unknown[]) => void;
    let resolveFilter!: (items: unknown[]) => void;
    const provider = (_filter: string | undefined, value: unknown) => new Promise<unknown[]>(resolve => {
      if (value === 2) resolveLookup = resolve;
      else resolveFilter = resolve;
    });
    const f = await comboboxFixture('', { items: provider });
    f.component.value = 2;
    await settle();
    f.component.value = reset;
    await settle();
    await type(f.input, text);
    const matches = text === 'Be' ? [options[2]] : [];
    resolveFilter(matches);
    await settle();
    resolveLookup([options[2]]);
    await settle();
    expect(f.component.value).toBeUndefined();
    expect(f.component.text).toBe(text);
    expect(f.input.value).toBe(text);
    expect(f.vm.selectedOption).toBeUndefined();
    expect(f.vm.filteredItems).toEqual(matches);
    expect(f.vm.open).toBe(true);
  });

  it('ignores stale asynchronous filter responses', async () => {
    const requests = new Map<string, (items: unknown[]) => void>();
    const provider = vi.fn((filter: string) => new Promise<unknown[]>(resolve => requests.set(filter, resolve)));
    const f = await comboboxFixture('', { items: provider });
    await type(f.input, 'A');
    await type(f.input, 'Be');
    requests.get('Be')!([options[2]]);
    await settle();
    expect(f.vm.filteredItems).toEqual([options[2]]);
    requests.get('A')!([options[0]]);
    await settle();
    expect(f.vm.filteredItems).toEqual([options[2]]);
    expect(f.input.value).toBe('Be');
    expect(provider).toHaveBeenNthCalledWith(1, 'A', undefined);
    expect(provider).toHaveBeenNthCalledWith(2, 'Be', undefined);
  });
});
