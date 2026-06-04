import { templateCompilerHooks } from 'aurelia';

@templateCompilerHooks
export class EnhanceUiButton {
  compiling(template: HTMLElement | HTMLTemplateElement) {
    template.innerHTML = template.innerHTML
      // Element form -> native <button> hosting the component, so Enter/Space activate natively.
      .replaceAll('<ui-icon-button>', '<button as-element="ui-icon-button">')
      .replaceAll('<ui-icon-button ', '<button as-element="ui-icon-button" ')
      .replaceAll('</ui-icon-button>', '</button>')
      .replaceAll('<ui-button>', '<button as-element="ui-button">')
      .replaceAll('<ui-button ', '<button as-element="ui-button" ')
      .replaceAll('</ui-button>', '</button>')
      // Attribute form (e.g. <button ui-icon-button>) -> as-element.
      .replace(/\sui-icon-button(?:="")?(?=\s|>)/g, ' as-element="ui-icon-button"')
      .replace(/\sui-button(?:="")?(?=\s|>)/g, ' as-element="ui-button"');
  }
}
