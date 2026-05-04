import { customElement, newInstanceForScope, resolve } from 'aurelia';
import { IValidationRules } from '@aurelia/validation';
import { IValidationController } from '@aurelia/validation-html';
import template from './combobox-view.html?raw';

type Project = {
  id: string;
  name: string;
  region: string;
  disabled?: boolean;
};

@customElement({ name: 'combobox-view', template })
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
  virtualProjectQuery = '';
  selectedVirtualProjectId: string | undefined;
  selectedVirtualProject: Project | undefined;

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

  get filteredProjects(): Project[] {
    return this.filterProjects(this.projectQuery);
  }

  get filteredTeams(): Project[] {
    return this.filterProjects(this.teamQuery);
  }

  get filteredInitialProjects(): Project[] {
    return this.filterProjects(this.initialProjectQuery);
  }

  get filteredVirtualProjects(): Project[] {
    return this.filterVirtualProjects(this.virtualProjectQuery);
  }

  private filterProjects(query: string | undefined): Project[] {
    const value = query?.trim().toLowerCase();
    if (!value) {
      return this.projects;
    }

    return this.projects.filter(project => `${project.name} ${project.region}`.toLowerCase().includes(value));
  }

  private filterVirtualProjects(query: string | undefined): Project[] {
    const value = query?.trim().toLowerCase();
    if (!value) {
      return this.virtualProjects;
    }

    return this.virtualProjects.filter(project => `${project.name} ${project.region}`.toLowerCase().includes(value));
  }
}
