export class ButtonView {
  clickCount = 0;
  isLoading = false;

  handleClick(): void {
    this.clickCount++;
  }

  toggleLoading(): void {
    this.isLoading = !this.isLoading;
  }
}
