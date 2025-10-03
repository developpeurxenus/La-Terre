const dangerousPattern = /[<>]/g;

export function sanitizeString(value: string): string {
  return value.replace(dangerousPattern, '');
}

export function sanitizePayload(payload: unknown): unknown {
  if (typeof payload === 'string') {
    return sanitizeString(payload);
  }

  if (Array.isArray(payload)) {
    return payload.map((entry) => sanitizePayload(entry));
  }

  if (payload && typeof payload === 'object') {
    return Object.entries(payload).reduce<Record<string, unknown>>((acc, [key, value]) => {
      acc[sanitizeString(key)] = sanitizePayload(value);
      return acc;
    }, {});
  }

  return payload;
}
