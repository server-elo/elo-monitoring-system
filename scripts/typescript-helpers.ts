export function assertDefined<T>(
  value: T | undefined | null,
  message: string,
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
}
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}
export function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}
