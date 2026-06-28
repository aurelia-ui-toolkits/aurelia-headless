import { newInstanceForScope, resolve } from 'aurelia';
import { IValidationRules } from '@aurelia/validation';
import { IValidationController } from '@aurelia/validation-html';
import { AlertService, validate } from '@aurelia-ui-toolkits/headless';

type TeamOption = {
  id: string;
  name: string;
};

export class FormView {
  workspaceName = '';
  ownerEmail = '';
  teamId = '';
  summary = '';
  notifyTeam = false;
  saveMessage = 'No form action yet.';

  public validationController: IValidationController = resolve(newInstanceForScope(IValidationController));
  public alertService: AlertService = resolve(AlertService);

  readonly teams: TeamOption[] = [
    { id: 'platform', name: 'Platform' },
    { id: 'design', name: 'Design systems' },
    { id: 'support', name: 'Support' }
  ];

  constructor() {
    resolve(IValidationRules).on(FormView)
      .ensure(x => x.workspaceName).required().minLength(3)
      .ensure(x => x.ownerEmail).required().email()
      .ensure(x => x.teamId).required()
      .ensure(x => x.summary).required().minLength(12);
  }

  @validate()
  async saveProfile(): Promise<void> {
    this.saveMessage = `Saved ${this.workspaceName} for ${this.selectedTeamName}.`;
  }

  resetProfile(): void {
    this.workspaceName = '';
    this.ownerEmail = '';
    this.teamId = '';
    this.summary = '';
    this.notifyTeam = false;
    this.saveMessage = 'Form reset.';
    this.validationController.reset();
  }

  private get selectedTeamName(): string {
    return this.teams.find(team => team.id === this.teamId)?.name ?? 'Unknown team';
  }
}
