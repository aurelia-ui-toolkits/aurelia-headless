type TeamOption = {
  id: string;
  name: string;
};

export class FormView {
  workspaceName = 'Aurora Ops';
  ownerEmail = 'ops@example.com';
  teamId = 'platform';
  summary = 'Coordinate release checks, deployment windows, and post-launch monitoring.';
  notifyTeam = true;
  saveMessage = 'No form action yet.';

  readonly teams: TeamOption[] = [
    { id: 'platform', name: 'Platform' },
    { id: 'design', name: 'Design systems' },
    { id: 'support', name: 'Support' }
  ];

  saveProfile(): void {
    this.saveMessage = `Saved ${this.workspaceName} for ${this.selectedTeamName}.`;
  }

  resetProfile(): void {
    this.workspaceName = '';
    this.ownerEmail = '';
    this.teamId = 'platform';
    this.summary = '';
    this.notifyTeam = false;
    this.saveMessage = 'Form reset.';
  }

  private get selectedTeamName(): string {
    return this.teams.find(team => team.id === this.teamId)?.name ?? 'Unknown team';
  }
}
