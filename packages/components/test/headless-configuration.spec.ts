import { expect, it } from 'vitest';
import { HeadlessConfiguration } from '../src/headless-configuration';

it('prevents replacing component configurations while allowing customization of their members', () => {
  const configuration = new HeadlessConfiguration();
  const names = ['field', 'table', 'datepicker', 'alertService', 'alert', 'breadcrumbs',
    'chip', 'floatingActions', 'progress', 'slider', 'toastRegion'] as const;

  for (const name of names) {
    const original = configuration[name];
    expect(Reflect.set(configuration, name, {})).toBe(false);
    expect(configuration[name]).toBe(original);
  }

  const customize = (c: HeadlessConfiguration) => {
    c.table.rowsPerPageText = 'Page length';
    c.datepicker.i18n.openPicker = 'Choose date';
  };
  customize(configuration);
  expect(configuration.table.rowsPerPageText).toBe('Page length');
  expect(configuration.datepicker.i18n.openPicker).toBe('Choose date');
});
