import { customElement, newInstanceForScope, resolve } from 'aurelia';
import { IValidationRules } from '@aurelia/validation';
import { IValidationController } from '@aurelia/validation-html';
import template from './select-view.html?raw';
import './select-view.css';

type Project = {
  id: string;
  name: string;
  region: string;
  disabled?: boolean;
};

@customElement({ name: 'select-view', template })
export class SelectView {
  selectedProjectId: string | undefined;
  selectedProject: Project | undefined;
  selectedTeamId: string | undefined;
  selectedTeam: Project | undefined;

  public validationController: IValidationController = resolve(newInstanceForScope(IValidationController));

  readonly projects: Project[] = [
    { id: 'aurora', name: 'Aurora', region: 'EU West' },
    { id: 'helios', name: 'Helios', region: 'US East' },
    { id: 'atlas', name: 'Atlas', region: 'AP South', disabled: true },
    { id: 'nova', name: 'Nova', region: 'US West' }
  ];

  constructor() {
    resolve(IValidationRules).on(SelectView).ensure(x => x.selectedProjectId).required();
  }
}
