export function requestKeyToSnakeCase(key) {
  if (typeof key !== 'string' || key.length === 0) {
    return key
  }
  if (!/[A-Z]/.test(key)) {
    return key
  }
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
}

export function deepMapRequestKeysToSnakeCase(input) {
  if (input == null || typeof input !== 'object') {
    return input
  }
  if (Array.isArray(input)) {
    return input.map(deepMapRequestKeysToSnakeCase)
  }
  if (
    input instanceof Date
    || input instanceof FormData
    || input instanceof Blob
  ) {
    return input
  }
  const out = {}
  for (const key of Object.keys(input)) {
    out[requestKeyToSnakeCase(key)] = deepMapRequestKeysToSnakeCase(input[key])
  }
  return out
}
