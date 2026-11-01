import type { JsonValue } from '@active-book/types';

const validateJson = (value: unknown, ancestors: Set<object>): void => {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
  ) {
    return;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return;
  }

  if (typeof value !== 'object' || ancestors.has(value)) {
    throw new Error('Visual effect data must contain finite, non-cyclic JSON values only');
  }

  const prototype = Object.getPrototypeOf(value);

  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    throw new Error('Visual effect data must contain plain JSON objects only');
  }

  ancestors.add(value);

  for (const valueCur of Object.values(value)) {
    validateJson(valueCur, ancestors);
  }

  ancestors.delete(value);
};

const freezeJson = (value: unknown): void => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeJson);
    Object.freeze(value);
  }
};

/** Copy at the host boundary so external mutations cannot change an existing snapshot. */
export const copyVisualData = <Value extends JsonValue>(value: Value): Value => {
  validateJson(value, new Set());

  // JSON validation above guarantees a lossless copy of the supplied typed data.
  const copied: Value = JSON.parse(JSON.stringify(value));

  freezeJson(copied);

  return copied;
};
