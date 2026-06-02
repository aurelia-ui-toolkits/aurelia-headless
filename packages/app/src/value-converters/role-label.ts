import { valueConverter } from 'aurelia';

@valueConverter('roleLabel')
export class RoleLabelValueConverter {
  toView(value: string): string {
    return {
      admin: 'Administrator',
      user: 'User',
      auditor: 'Auditor',
      owner: 'Owner'
    }[value] ?? value;
  }
}
