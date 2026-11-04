/** Create a bubbling event without converting an undefined option value to null. */
export function createValueEvent(type: string, value: unknown): CustomEvent {
  const event = new CustomEvent(type, { bubbles: true, detail: value });
  // CustomEvent's default detail is null, even when undefined is explicitly supplied.
  if (value === undefined) {
    Object.defineProperty(event, 'detail', { value });
  }
  return event;
}
