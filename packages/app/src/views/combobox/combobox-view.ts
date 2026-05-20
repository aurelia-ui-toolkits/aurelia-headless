import { newInstanceForScope, resolve } from 'aurelia';
import { IValidationRules } from '@aurelia/validation';
import { IValidationController } from '@aurelia/validation-html';

type Project = {
  id: string;
  name: string;
  region: string;
  disabled?: boolean;
};

export class ComboboxView {
  projectQuery = '';
  selectedProjectId: string | undefined;
  selectedProject: Project | undefined;
  teamQuery = '';
  selectedTeamId: string | undefined;
  selectedTeam: Project | undefined;
  initialProjectQuery = 'Helios';
  initialProjectId: string = 'helios';
  initialProject: Project | undefined;
  selectedVirtualProjectId: string | undefined;
  selectedVirtualProject: Project | undefined;
  virtualProjectQuery: string = '';

  public validationController: IValidationController = resolve(newInstanceForScope(IValidationController));

  readonly projects: Project[] = [
    { id: 'aurora', name: 'Aurora', region: 'EU West' },
    { id: 'helios', name: 'Helios', region: 'US East' },
    { id: 'atlas', name: 'Atlas', region: 'AP South', disabled: true },
    { id: 'nova', name: 'Nova', region: 'US West' }
  ];

  readonly virtualProjects: Project[] = Array.from({ length: 200 }, (_, index) => ({
    id: `project-${index + 1}`,
    name: `Project ${index + 1}`,
    region: ['EU West', 'US East', 'AP South', 'US West'][index % 4],
    disabled: (index + 1) % 17 === 0
  }));

  constructor() {
    this.initialProject = this.projects.find(project => project.id === this.initialProjectId);
    resolve(IValidationRules).on(ComboboxView).ensure(x => x.selectedProjectId).required();
  }
}
