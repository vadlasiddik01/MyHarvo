export function normalizeName(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function normalizeNameFields<T extends Record<string, any>>(data: T, fields: string[]) {
  const normalized = { ...data };

  for (const field of fields) {
    if (typeof normalized[field] === 'string') {
      normalized[field] = normalizeName(normalized[field]);
    }
  }

  return normalized;
}

export function exactNameRegex(value: unknown) {
  const normalized = normalizeName(value);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}
