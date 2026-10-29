import { IDialogController, IDialogService } from '@aurelia/dialog';
import { Registration } from 'aurelia';
import { describe, expect, it, vi } from 'vitest';
import { settle } from './fixture';
import { mount, UI, viewModel } from './library-fixture';
import { UiPromptDialog } from '../src/alert-service/prompt-dialog/ui-prompt-dialog';
import { UiDatepickerDialog } from '../src/datepicker/ui-datepicker-dialog';
import { UiDatepickerDialogConfiguration } from '../src/datepicker/ui-datepicker-dialog-configuration';
import { parseCanonical, toCanonical } from '../src/datepicker/date-utils';

describe('ui-datepicker', () => {
  it('uses the per-picker open label and falls back when it is omitted', async () => {
    const f = await mount('<ui-datepicker i18n.bind="translations"></ui-datepicker>',
      { translations: { openPicker: 'Choose date' } as UI.UiDatepickerI18n },
      [UI.UiDatepicker, Registration.instance(IDialogService, {})]);
    const button = f.getBy('.ui-datepicker__button')!;
    expect(button.getAttribute('aria-label')).toBe('Choose date');
    f.component.translations = {};
    await settle();
    expect(button.getAttribute('aria-label')).toBe('Open date picker');
  });

  it('passes default-time to the popup without populating an empty field on cancellation', async () => {
    const service = { open: vi.fn(() => ({ whenClosed: () => Promise.resolve({ status: 'cancel' }) })) };
    const f = await mount('<ui-datepicker time default-time="00:00" value.two-way="value" format="dd/MM/yyyy HH:mm" inputmask-format="dd/MM/yyyy HH:mm"></ui-datepicker>', { value: '' }, [UI.UiDatepicker, Registration.instance(IDialogService, service)]);
    const vm = viewModel<UI.UiDatepicker>(f.getBy('ui-datepicker')!);
    const change = vi.fn();
    f.appHost.addEventListener('change', change);

    await vm.openDialog();
    await settle();

    expect(service.open).toHaveBeenCalledWith(expect.objectContaining({ model: expect.objectContaining({ value: '', time: true, defaultTime: '00:00' }) }));
    expect(f.component.value).toBe('');
    expect(vm.value).toBe('');
    expect(change).not.toHaveBeenCalled();
  });

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
  it('keeps English labels for omitted translations and applies per-picker overrides', async () => {
    const configuration = new UI.HeadlessConfiguration();
    const configure = (c: UI.HeadlessConfiguration) => {
      c.datepicker.i18n.ok = 'Confirm';
      c.datepicker.i18n.previousMonth = undefined;
    };
    configure(configuration);
    const f = await mount('<ui-datepicker-dialog></ui-datepicker-dialog>', {}, [UiDatepickerDialog,
      Registration.instance(IDialogController, {}),
      Registration.instance(UiDatepickerDialogConfiguration, configuration.datepicker)]);
    const vm = viewModel<UiDatepickerDialog>(f.getBy('ui-datepicker-dialog')!);
    vm.activate({ value: undefined, time: true, i18n: { month: 'Choose month', year: undefined, nextMonth: undefined, hour: undefined, minute: undefined } });
    await settle();
    expect(f.getBy('.ui-datepicker-dialog__month')!.getAttribute('aria-label')).toBe('Choose month');
    expect(f.getBy('.ui-datepicker-dialog__year')!.getAttribute('aria-label')).toBe('Year');
    const navigation = f.getAllBy('.ui-datepicker-dialog__nav-button');
    expect(navigation[0].getAttribute('aria-label')).toBe('Previous month');
    expect(navigation[1].getAttribute('aria-label')).toBe('Next month');
    expect(f.getAllBy('.ui-datepicker-dialog__time-field span').map(el => el.textContent)).toEqual(['Hour', 'Minute']);
    expect(vm.okText).toBe('Confirm');
  });

  it.each([
    { defaultTime: '00:00', expected: '00:00:00' },
    { defaultTime: '08:15', expected: '08:15:00' },
    { defaultTime: undefined, expected: '14:45:00' },
    { defaultTime: '25:00', expected: '14:45:00' },
  ])('uses $expected when selecting a day with default-time $defaultTime', async ({ defaultTime, expected }) => {
    const dialog = { ok: vi.fn(), cancel: vi.fn() };
    const f = await mount('<ui-datepicker-dialog></ui-datepicker-dialog>', {}, [UiDatepickerDialog, Registration.instance(IDialogController, dialog)]);
    const vm = viewModel<UiDatepickerDialog>(f.getBy('ui-datepicker-dialog')!);
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date(2024, 1, 15, 14, 45));
      vm.activate({ value: undefined, time: true, defaultTime });
      vm.selectDay(vm.days.find(day => day.date?.getDate() === 29 && !day.outside)!);
      await vm.ok();
      expect(dialog.ok).toHaveBeenCalledWith(`2024-02-29T${expected}`);
    } finally {
      vi.useRealTimers();
    }
  });

  it('supports a global default, per-picker override, date-only mode and min constraints', async () => {
    const configuration = new UiDatepickerDialogConfiguration();
    configuration.defaultTime = '08:15';
    const dialog = { ok: vi.fn(), cancel: vi.fn() };
    const f = await mount('<ui-datepicker-dialog></ui-datepicker-dialog>', {}, [UiDatepickerDialog, Registration.instance(IDialogController, dialog), Registration.instance(UiDatepickerDialogConfiguration, configuration)]);
    const vm = viewModel<UiDatepickerDialog>(f.getBy('ui-datepicker-dialog')!);
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date(2024, 1, 15, 14, 45));
      vm.activate({ value: undefined, time: true });
      expect(toCanonical(vm.selectedDate, true)).toBe('2024-02-15T08:15:00');
      vm.activate({ value: undefined, time: true, defaultTime: '00:00' });
      expect(toCanonical(vm.selectedDate, true)).toBe('2024-02-15T00:00:00');
      vm.activate({ value: undefined, time: true, defaultTime: '00:00', min: '2024-02-15T06:00:00' });
      expect(toCanonical(vm.selectedDate, true)).toBe('2024-02-15T06:00:00');
      vm.activate({ value: undefined, time: false, defaultTime: '00:00' });
      vm.selectDay(vm.days.find(day => day.date?.getDate() === 29 && !day.outside)!);
      await vm.ok();
      expect(dialog.ok).toHaveBeenCalledWith('2024-02-29');
    } finally {
      vi.useRealTimers();
    }
  });

  it('ui-datepicker-dialog builds a leap-year calendar, disables restricted days and confirms canonical time', async () => {
    const dialog = { ok: vi.fn(), cancel: vi.fn() };
    const f = await mount('<ui-datepicker-dialog></ui-datepicker-dialog>', {}, [UiDatepickerDialog, Registration.instance(IDialogController, dialog)]);
    const vm = viewModel<UiDatepickerDialog>(f.getBy('ui-datepicker-dialog')!);
    vm.activate({ value: '2024-02-15T10:30:00', time: true, defaultTime: '00:00', min: '2024-02-10T00:00:00', max: '2024-02-29T23:59:00', disableWeekends: true, firstDay: 1 });
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
