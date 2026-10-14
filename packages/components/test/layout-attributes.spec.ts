import { CustomAttribute } from 'aurelia';
import { describe, expect, it, vi } from 'vitest';
import { key, settle } from './fixture';
import { dispatch, mount, UI } from './library-fixture';

function pointer(target: EventTarget, type: string, x: number, y = 0) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  target.dispatchEvent(event);
}

describe('ui-splitter', () => {
  it.each(['horizontal', 'vertical'])('resizes in the %s direction with keyboard bounds and persistence', async direction => {
    localStorage.clear();
    const f = await mount(`<div id="target"></div><ui-splitter size.bind="size" direction="${direction}" min="80" max="300" storage-key="test"></ui-splitter>`, { size: 100 });
    const host = f.getBy<HTMLElement>('ui-splitter')!;
    await key(host, direction === 'horizontal' ? 'ArrowRight' : 'ArrowDown', { shiftKey: true });
    expect(f.component.size).toBe(150);
    expect(f.getBy<HTMLElement>('#target')!.style[direction === 'horizontal' ? 'width' : 'height']).toBe('150px');
    await key(host, 'End');
    expect(f.component.size).toBe(300);
    await key(host, 'Home');
    expect(f.component.size).toBe(80);
    expect(JSON.parse(localStorage.getItem('ui-splitter:test:size')!).size).toBe(80);
  });

  it('collapses on a click-sized pointer gesture and restores the last expanded size', async () => {
    const f = await mount('<div id="target"></div><ui-splitter size.bind="size"></ui-splitter>', { size: 200 });
    const host = f.getBy<HTMLElement>('ui-splitter')!;
    host.setPointerCapture = vi.fn();
    pointer(host, 'pointerdown', 10);
    pointer(window, 'pointerup', 10);
    await settle();
    expect(f.component.size).toBe(0);
    expect(f.getBy<HTMLElement>('#target')!.style.display).toBe('none');
    pointer(host, 'pointerdown', 10);
    pointer(window, 'pointerup', 10);
    await settle();
    expect(f.component.size).toBe(200);
  });

  it('mirrors next-sibling resizing and ignores disabled input', async () => {
    const f = await mount('<ui-splitter target="next" size.bind="size" disabled.bind="disabled"></ui-splitter><div></div>', { size: 200, disabled: false });
    const host = f.getBy<HTMLElement>('ui-splitter')!;
    await key(host, 'ArrowRight');
    expect(f.component.size).toBe(190);
    f.component.disabled = true;
    await settle();
    await key(host, 'Home');
    expect(f.component.size).toBe(190);
  });
});

describe('custom attributes', () => {
  it('ui-size publishes observed dimensions and disconnects on teardown', async () => {
    let callback!: ResizeObserverCallback;
    const disconnect = vi.fn();
    const original = globalThis.ResizeObserver;
    vi.stubGlobal('ResizeObserver', class {
      constructor(cb: ResizeObserverCallback) { callback = cb; }
      observe() {}
      disconnect = disconnect;
    });
    try {
      const f = await mount('<div ui-size="value.from-view: size; width.from-view: width; height.from-view: height"></div>', { size: undefined as UI.Size | undefined, width: 0, height: 0 });
      callback([{ contentRect: { width: 120, height: 60 } } as ResizeObserverEntry], {} as ResizeObserver);
      await settle();
      expect(f.component.size).toEqual({ width: 120, height: 60 });
      expect(f.component.width).toBe(120);
      expect(f.component.height).toBe(60);
      await f.stop(true);
      expect(disconnect).toHaveBeenCalledTimes(1);
    } finally {
      vi.stubGlobal('ResizeObserver', original);
    }
  });

  it('ui-inputmask formats complete values, retains incomplete input and removes the mask on detach', async () => {
    const f = await mount('<input ui-inputmask="mask: 99-99; value.bind: value; incomplete-value.bind: incomplete; is-value-masked: true">', { value: '1234', incomplete: undefined as string | undefined });
    const input = f.getBy<HTMLInputElement>('input')!;
    expect(input.value).toBe('12-34');
    input.value = '56';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(f.component.value).toBeUndefined();
    expect(f.component.incomplete).toBe('56');
    f.component.value = '7890';
    await settle();
    expect(input.value).toBe('78-90');
    await f.stop(true);
    expect(input.inputmask).toBeUndefined();
  });

  it('ui-inputmask on an inset ui-input floats the label for values the mask writes', async () => {
    const f = await mount('<ui-input inset label="Amount" ui-inputmask="mask: 99-99; value.bind: value"></ui-input>', { value: '1234' });
    const input = f.getBy<HTMLInputElement>('input')!;
    const label = f.getBy<HTMLElement>('.ui-input__inset-label')!;
    expect(input.value).toBe('12-34');
    expect(label.hasAttribute('data-floating')).toBe(true);
    f.component.value = '';
    await settle();
    expect(input.value).toBe('');
    expect(label.hasAttribute('data-floating')).toBe(false);
    f.component.value = '5678';
    await settle();
    expect(input.value).toBe('56-78');
    expect(label.hasAttribute('data-floating')).toBe(true);
  });

  it('an inset ui-input floats the label for typed values and element-API writes', async () => {
    const f = await mount('<ui-input inset label="Name"></ui-input>', {});
    const host = f.getBy<HTMLElement & { value: string }>('.ui-input')!;
    const input = f.getBy<HTMLInputElement>('input')!;
    const label = f.getBy<HTMLElement>('.ui-input__inset-label')!;
    expect(label.hasAttribute('data-floating')).toBe(false);
    input.value = 'typed';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(label.hasAttribute('data-floating')).toBe(true);
    host.value = '';
    await settle();
    expect(label.hasAttribute('data-floating')).toBe(false);
    host.value = 'written';
    await settle();
    expect(input.value).toBe('written');
    expect(label.hasAttribute('data-floating')).toBe(true);
  });

  it('ui-reorder emits a move intent from pointer input, without mutating consumer items', async () => {
    const f = await mount('<ui-list ui-reorder items.bind="items"><ui-list-item repeat.for="item of items" value.bind="item"><span textcontent.bind="item"></span></ui-list-item></ui-list>', { items: ['a', 'b', 'c'] });
    const host = f.getBy<HTMLElement>('ui-list')!;
    const attribute = CustomAttribute.for<UI.UiReorder>(host, 'ui-reorder')!.viewModel;
    const rows = f.getAllBy<HTMLElement>('ui-list-item');
    vi.spyOn(attribute.host.reorderContainer, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 90));
    rows.forEach((row, index) => vi.spyOn(row, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, index * 30, 100, 30)));
    const moved = vi.fn();
    host.addEventListener('reorder', moved);
    pointer(rows[0], 'pointerdown', 10, 10);
    pointer(window, 'pointermove', 10, 80);
    expect(document.querySelector('.ui-reorder-ghost')).not.toBeNull();
    pointer(window, 'pointerup', 10, 80);
    await settle();
    expect((moved.mock.calls[0][0] as CustomEvent).detail).toEqual({ items: ['a'], from: [0], to: 2 });
    expect(f.component.items).toEqual(['a', 'b', 'c']);
    expect(document.querySelector('.ui-reorder-ghost')).toBeNull();
    attribute.disabled = true;
    await settle();
    expect(host.hasAttribute('data-ui-reorder')).toBe(false);
    dispatch(rows[0], 'pointerdown');
    expect(moved).toHaveBeenCalledTimes(1);
  });
});
