export function normalizeName(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function normalizeNameFields<T extends Record<string, any>>(data: T, fields: string[]) {
  const normalized = { ...data };

  for (const field of fields) {
    const key = field as keyof T;
    if (typeof normalized[key] === 'string') {
      normalized[key] = normalizeName(normalized[key]) as T[keyof T];
    }
  }

  return normalized;
}

export function exactNameRegex(value: unknown) {
  const normalized = normalizeName(value);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}
