export function parseEnumValue<T extends string>(
  values: readonly T[],
  value: string | null | undefined,
) {
  if (!value || value === "ALL") {
    return undefined;
  }

  return values.includes(value as T) ? (value as T) : undefined;
}
