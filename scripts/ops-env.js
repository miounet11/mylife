function readPositiveIntegerValue(value, defaultValue, options = {}) {
  const min = Number.isInteger(options.min) ? options.min : 1;
  const max = Number.isInteger(options.max) ? options.max : Number.MAX_SAFE_INTEGER;
  const raw = value === undefined || value === null ? '' : `${value}`.trim();
  const parsed = raw === '' ? defaultValue : Number(raw);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return defaultValue;
  }

  return parsed;
}

function readPositiveIntegerEnv(name, defaultValue, options = {}) {
  return readPositiveIntegerValue(process.env[name], defaultValue, options);
}

function readPortEnv(name, defaultValue) {
  return readPositiveIntegerEnv(name, defaultValue, { min: 1, max: 65535 });
}

function readNonEmptyCsvEnv(name, defaultValues) {
  const fallback = Array.isArray(defaultValues)
    ? defaultValues.map((value) => `${value}`.trim()).filter(Boolean)
    : [];
  const raw = process.env[name];
  const values = `${raw === undefined ? '' : raw}`
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length ? values : fallback;
}

module.exports = {
  readNonEmptyCsvEnv,
  readPortEnv,
  readPositiveIntegerEnv,
  readPositiveIntegerValue,
};
