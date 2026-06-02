export function setBindingIfNotPresent(element: Element, bindings: readonly [property: string, value: string][]): void {
  for (const [property, value] of bindings) {
    setSingleBindingIfNotPresent(element, property, value);
  }
}

function setSingleBindingIfNotPresent(element: Element, property: string, value: string): void {
  if (element.hasAttribute(property)
    || element.hasAttribute(`${property}.bind`)
    || element.hasAttribute(`${property}.two-way`)
    || element.hasAttribute(`${property}.to-view`)
    || element.hasAttribute(`${property}.from-view`)) {
    return;
  }

  element.setAttribute(`${property}.bind`, value);
}
