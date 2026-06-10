export class FloatingActionsView {
  actionLog = 'No action selected yet.';

  recordAction(action: string): void {
    this.actionLog = `${action} selected.`;
  }
}
