export function hasBinding(element: Element, property: string): boolean {
  return element.hasAttribute(property)
    || element.hasAttribute(`${property}.bind`)
    || element.hasAttribute(`${property}.two-way`)
    || element.hasAttribute(`${property}.to-view`)
    || element.hasAttribute(`${property}.from-view`);
}
