import { newInstanceForScope, resolve } from 'aurelia';
import { IValidationRules } from '@aurelia/validation';
import { IValidationController } from '@aurelia/validation-html';

type Project = {
  id: string;
  name: string;
  region: string;
  disabled?: boolean;
};

export class SelectView {
  selectedProjectId: string | undefined;
  selectedProject: Project | undefined;
  selectedTeamId: string | undefined;
  selectedTeam: Project | undefined;
  selectedVirtualProjectId: string = 'project-120';
  selectedVirtualProject: Project | undefined;
  virtualProjects: Project[] = [];

  public validationController: IValidationController = resolve(newInstanceForScope(IValidationController));

  readonly projects: Project[] = [
    { id: 'aurora', name: 'Aurora', region: 'EU West' },
    { id: 'helios', name: 'Helios', region: 'US East' },
    { id: 'atlas', name: 'Atlas', region: 'AP South', disabled: true },
    { id: 'nova', name: 'Nova', region: 'US West' }
  ];

  constructor() {
    setTimeout(() => {
      this.virtualProjects = Array.from({ length: 200 }, (_, index) => ({
        id: `project-${index + 1}`,
        name: `Project ${index + 1}`,
        region: ['EU West', 'US East', 'AP South', 'US West'][index % 4],
        disabled: (index + 1) % 17 === 0
      }));
      this.selectedVirtualProject = this.virtualProjects.find(project => project.id === this.selectedVirtualProjectId);
    }, 800);
    resolve(IValidationRules).on(SelectView).ensure(x => x.selectedProjectId).required();
  }
}
