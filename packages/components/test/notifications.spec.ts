import { Aurelia, Registration } from 'aurelia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { key, settle } from './fixture';
import { dispatch, mount, UI } from './library-fixture';

afterEach(() => {
  document.querySelectorAll('.ui-toast-host, .ui-tooltip').forEach(host => host.remove());
});

describe('toast components and service', () => {
  it('ui-toast-region renders roles, dismissal and action events', async () => {
    const f = await mount('<ui-toast-region toasts.bind="toasts"></ui-toast-region>', { toasts: [
      { id: 1, tone: 'danger', message: 'Failed', duration: 0, action: { label: 'Retry', handler: vi.fn() } },
    ] });
    expect(f.getBy('ui-alert')!.getAttribute('role')).toBe('alert');
    const action = vi.fn();
    const closed = vi.fn();
    f.appHost.addEventListener('toast-action', action);
    f.appHost.addEventListener('toast-close', closed);
    f.getBy<HTMLButtonElement>('.ui-toast-region__action')!.click();
    f.getBy<HTMLButtonElement>('.ui-alert__close')!.click();
    expect((action.mock.calls[0][0] as CustomEvent).detail).toBe(1);
    expect((closed.mock.calls[0][0] as CustomEvent).detail).toBe(1);
  });

  it('UiToastService shares concurrent enhancement, invokes actions once and clears messages', async () => {
    const f = await mount('<div></div>', {});
    const enhance = vi.spyOn(Aurelia, 'enhance').mockResolvedValue(undefined as never);
    const service = f.container.get(UI.UiToastService);
    const handler = vi.fn();
    const [first, second] = await Promise.all([
      service.show({ message: 'First', duration: 0, action: { label: 'Undo', handler } }),
      service.show({ message: 'Second', duration: 0 }),
    ]);
    expect(enhance).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('.ui-toast-host')).toHaveLength(1);
    expect(service.toasts.map(toast => toast.id)).toEqual([first, second]);
    service.invokeAction(first);
    service.invokeAction(first);
    expect(handler).toHaveBeenCalledTimes(1);
    service.clear();
    expect(service.toasts).toEqual([]);
  });

  it('UiToastService expires timed messages and preserves persistent messages', async () => {
    const f = await mount('<div></div>', {});
    vi.spyOn(Aurelia, 'enhance').mockResolvedValue(undefined as never);
    vi.useFakeTimers();
    try {
      const service = f.container.get(UI.UiToastService);
      await service.show({ message: 'Timed', duration: 50 });
      await service.show({ message: 'Persistent', duration: 0 });
      await vi.advanceTimersByTimeAsync(50);
      expect(service.toasts.map(toast => toast.message)).toEqual(['Persistent']);
      service.clear();
    } finally { vi.useRealTimers(); }
  });
});

describe('tooltip attribute and service', () => {
  it('ui-tooltip opens on focus, preserves existing descriptions and removes listeners on detach', async () => {
    const service = { tooltipId: 'tip', show: vi.fn().mockResolvedValue(undefined), hide: vi.fn() };
    const f = await mount('<button aria-describedby="hint" ui-tooltip="text.bind: text; open-delay: 0; close-delay: 0; disabled.bind: disabled">Help</button>', { text: 'Explanation', disabled: false }, [UI.UiTooltip, Registration.instance(UI.UiTooltipService, service)]);
    const button = f.getBy<HTMLButtonElement>('button')!;
    button.focus();
    await settle();
    expect(service.show).toHaveBeenCalledWith(expect.objectContaining({ anchor: button, text: 'Explanation' }));
    expect(button.getAttribute('aria-describedby')).toBe('hint tip');
    await key(button, 'Escape');
    expect(button.getAttribute('aria-describedby')).toBe('hint');
    f.component.disabled = true;
    await settle();
    service.show.mockClear();
    dispatch(button, 'pointerenter');
    await settle();
    expect(service.show).not.toHaveBeenCalled();
    await f.stop(true);
    f.component.disabled = false;
    dispatch(button, 'pointerenter');
    await settle();
    expect(service.show).not.toHaveBeenCalled();
  });

  it('UiTooltipService applies the latest concurrent show and ignores hide from a different anchor', async () => {
    const f = await mount('<button>First</button><button>Second</button>', {});
    const enhance = vi.spyOn(Aurelia, 'enhance').mockResolvedValue(undefined as never);
    const service = f.container.get(UI.UiTooltipService);
    const [first, second] = f.getAllBy<HTMLElement>('button');
    await Promise.all([
      service.show({ anchor: first, text: 'First', placement: 'top-start', offset: 6 }),
      service.show({ anchor: second, text: 'Second', placement: 'bottom-end', offset: 8 }),
    ]);
    expect(enhance).toHaveBeenCalledTimes(1);
    expect(service.anchor).toBe(second);
    expect(service.text).toBe('Second');
    service.hide(first);
    expect(service.open).toBe(true);
    service.hide(second);
    expect(service.open).toBe(false);
    expect(service.anchor).toBeUndefined();
  });
});
