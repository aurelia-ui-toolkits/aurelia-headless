import { IDialogController, IDialogService } from '@aurelia/dialog';
import { Registration } from 'aurelia';
import { describe, expect, it, vi } from 'vitest';
import { settle } from './fixture';
import { mount, UI, viewModel } from './library-fixture';
import { UiPromptDialog } from '../src/alert-service/prompt-dialog/ui-prompt-dialog';
import { UiDatepickerDialog } from '../src/datepicker/ui-datepicker-dialog';
import { parseCanonical, toCanonical } from '../src/datepicker/date-utils';

describe('ui-datepicker', () => {
  it('round-trips canonical dates through the real input mask and handles dialog acceptance/cancellation', async () => {
    let result = { status: 'ok', value: '2024-02-29' };
    const service = { open: vi.fn(() => ({ whenClosed: () => Promise.resolve(result) })) };
    const f = await mount('<ui-datepicker value.two-way="value" label="Date"></ui-datepicker>', { value: '2024-01-15' }, [UI.UiDatepicker, Registration.instance(IDialogService, service)]);
    const vm = viewModel<UI.UiDatepicker>(f.getBy('ui-datepicker')!);
    expect(vm.inputEl.value).toBe('15/01/2024');
    expect(vm.value).toBe('2024-01-15');
    const change = vi.fn();
    f.appHost.addEventListener('change', change);
    await vm.openDialog();
    await settle();
    expect(f.component.value).toBe('2024-02-29');
    expect(vm.open).toBe(false);
    expect(change).toHaveBeenCalledTimes(1);
    result = { status: 'cancel', value: '' };
    await vm.openDialog();
    await settle();
    expect(f.component.value).toBe('2024-02-29');
    expect(change).toHaveBeenCalledTimes(1);
    vm.readonly = true;
    await vm.openDialog();
    expect(service.open).toHaveBeenCalledTimes(2);
  });

  it('preserves ISO calendar dates and rejects impossible dates', () => {
    expect(toCanonical(parseCanonical('2024-02-29T23:00:00Z', false)!, false)).toBe('2024-02-29');
    expect(parseCanonical('2023-02-29', false)).toBeUndefined();
    expect(toCanonical(parseCanonical('2024-02-29T14:30', true)!, true)).toBe('2024-02-29T14:30:00');
  });
});

describe('dialog components', () => {
  it('ui-datepicker-dialog builds a leap-year calendar, disables restricted days and confirms canonical time', async () => {
    const dialog = { ok: vi.fn(), cancel: vi.fn() };
    const f = await mount('<ui-datepicker-dialog></ui-datepicker-dialog>', {}, [UiDatepickerDialog, Registration.instance(IDialogController, dialog)]);
    const vm = viewModel<UiDatepickerDialog>(f.getBy('ui-datepicker-dialog')!);
    vm.activate({ value: '2024-02-15T10:30:00', time: true, min: '2024-02-10T00:00:00', max: '2024-02-29T23:59:00', disableWeekends: true, firstDay: 1 });
    await settle();
    expect(vm.days).toHaveLength(42);
    expect(vm.weekdays).toHaveLength(7);
    expect(vm.days.find(day => day.date?.getDate() === 29 && !day.outside)?.disabled).toBe(false);
    const saturday = vm.days.find(day => day.date?.getDate() === 17 && !day.outside)!;
    expect(saturday.disabled).toBe(true);
    vm.selectDay(saturday);
    expect(vm.selectedDate.getDate()).toBe(15);
    vm.selectDay(vm.days.find(day => day.date?.getDate() === 29 && !day.outside)!);
    await vm.ok();
    expect(dialog.ok).toHaveBeenCalledWith('2024-02-29T10:30:00');
    vm.next();
    expect(vm.visibleMonth).toBe(2);
    vm.prev();
    expect(vm.visibleMonth).toBe(1);
    await vm.cancel();
    expect(dialog.cancel).toHaveBeenCalledTimes(1);
  });

  it('ui-alert-modal renders the payload and returns the selected action', async () => {
    const dialog = { ok: vi.fn() };
    const f = await mount('<ui-alert-modal></ui-alert-modal>', {}, [UI.UiAlertModal, Registration.instance(IDialogController, dialog)]);
    const vm = viewModel<UI.UiAlertModal>(f.getBy('ui-alert-modal')!);
    vm.activate({ caption: 'Confirm', message: 'Proceed?', button2Text: 'Yes', button2Action: 'yes' });
    await settle();
    f.assertText('.ui-alert-modal__title', 'Confirm');
    f.getBy<HTMLButtonElement>('button')!.click();
    await settle();
    expect(dialog.ok).toHaveBeenCalledWith('yes');
  });

  it('ui-prompt-modal validates required text, displays errors and supports OK/cancel', async () => {
    const dialog = { ok: vi.fn(), cancel: vi.fn() };
    const f = await mount('<ui-prompt-modal></ui-prompt-modal>', {}, [UiPromptDialog, Registration.instance(IDialogController, dialog)]);
    const vm = viewModel<UiPromptDialog>(f.getBy('ui-prompt-modal')!);
    vm.activate({ title: 'Name', required: true, text: '  ', okText: 'OK', cancelText: 'Cancel' });
    await vm.ok();
    await settle();
    expect(dialog.ok).not.toHaveBeenCalled();
    f.assertText('.ui-prompt-modal__error', 'This field is required.');
    vm.data.text = 'Valid';
    await vm.ok();
    expect(dialog.ok).toHaveBeenCalledWith('Valid');
    await vm.cancel();
    expect(dialog.cancel).toHaveBeenCalledTimes(1);
  });
});
