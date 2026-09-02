export function booleanAttr(val: unknown): boolean {
  return val === '' || (val !== 'false' && !!val);
}
