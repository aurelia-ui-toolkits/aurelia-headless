export class PopupView {
  basicOpen = false;
  inlineOpen = false;
  formOpen = false;

  basicAnchor: Element | undefined;
  inlineAnchor: Element | undefined;
  inlineTarget: Element | undefined;
  formAnchor: Element | undefined;

  formName = '';
  formEmail = '';
}
