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
  selectedTeamId: string | undefined;
  selectedVirtualProjectId: string = 'project-120';
  virtualProjects: Project[] = [];
  selectedMultiProjectIds: string[] = ['aurora', 'nova'];

  public validationController: IValidationController = resolve(newInstanceForScope(IValidationController));

  readonly projects: Project[] = [
    { id: 'aurora', name: 'Aurora', region: 'EU West' },
    { id: 'helios', name: 'Helios', region: 'US East' },
    { id: 'atlas', name: 'Atlas', region: 'AP South', disabled: true },
    { id: 'nova', name: 'Nova', region: 'US West' }
  ];

  readonly multiProjects: Project[] = this.projects.map(project => ({ ...project }));

  constructor() {
    setTimeout(() => {
      this.virtualProjects = Array.from({ length: 200 }, (_, index) => ({
        id: `project-${index + 1}`,
        name: `Project ${index + 1}`,
        region: ['EU West', 'US East', 'AP South', 'US West'][index % 4],
        disabled: (index + 1) % 17 === 0
      }));
    }, 800);
    resolve(IValidationRules).on(SelectView).ensure(x => x.selectedProjectId).required();
  }
}
