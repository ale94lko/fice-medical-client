export const consentFieldTypeValues = {
  text: 'TEXT',
  textarea: 'TEXTAREA',
  date: 'DATE',
  select: 'SELECT',
  checkbox: 'CHECKBOX',
  multiSelect: 'MULTI_SELECT',
}

function slugConsentFieldKey(raw) {
  return String(raw ?? '')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80)
}

function normalizeOption(raw) {
  if (raw == null) {
    return null
  }
  if (typeof raw === 'string') {
    const label = raw.trim()
    if (!label) {
      return null
    }

    return { value: slugConsentFieldKey(label) || label, label }
  }
  const label = String(raw.label ?? raw.name ?? '').trim()
  const value = String(raw.value ?? raw.key ?? '').trim()
    || slugConsentFieldKey(label)
  if (!label && !value) {
    return null
  }

  return { value: value || label, label: label || value }
}

function isoDateToUs(value) {
  const token = String(value ?? '').trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(token)
  if (!match) {
    return token
  }

  return `${match[2]}/${match[3]}/${match[1]}`
}

export function emptyValueForConsentField(fieldType) {
  if (fieldType === consentFieldTypeValues.multiSelect) {
    return []
  }
  if (fieldType === consentFieldTypeValues.checkbox) {
    return false
  }

  return ''
}

export function normalizeConsentFieldValue(raw = {}, index = 0) {
  const options = Array.isArray(raw.options)
    ? raw.options.map(normalizeOption).filter(Boolean)
    : []
  const fieldType = String(raw.field_type ?? raw.fieldType ?? 'TEXT')
    .trim()
    .toUpperCase() || consentFieldTypeValues.text
  let value = raw.value
  if (fieldType === consentFieldTypeValues.multiSelect) {
    value = Array.isArray(value) ? value : []
  } else if (fieldType === consentFieldTypeValues.checkbox) {
    value = value === true || value === 'true'
  } else if (fieldType === consentFieldTypeValues.date) {
    value = isoDateToUs(value)
  } else if (value == null) {
    value = ''
  }

  return {
    key: String(raw.key ?? '').trim(),
    label: String(raw.label ?? '').trim(),
    fieldType,
    required: Boolean(raw.required),
    displayOrder: Number(raw.display_order ?? raw.displayOrder ?? index),
    options,
    placeholder: String(raw.placeholder ?? '').trim(),
    helpText: String(raw.help_text ?? raw.helpText ?? '').trim(),
    readOnly: Boolean(raw.read_only ?? raw.readOnly),
    requiredWhenField: String(
      raw.required_when_field ?? raw.requiredWhenField ?? '',
    ).trim(),
    requiredWhenValue: String(
      raw.required_when_value ?? raw.requiredWhenValue ?? '',
    ).trim(),
    value,
  }
}

export function consentFieldHasValue(field, value) {
  if (field?.fieldType === consentFieldTypeValues.checkbox) {
    return value === true
  }
  if (field?.fieldType === consentFieldTypeValues.multiSelect) {
    return Array.isArray(value) && value.length > 0
  }

  return String(value ?? '').trim() !== ''
}

function valueMatchesCondition(field, value, expected) {
  const wanted = String(expected ?? '').trim()
  if (!wanted) {
    return false
  }
  if (field?.fieldType === consentFieldTypeValues.checkbox) {
    return value === true
      && ['true', 'yes', '1', 'checked', 'on']
        .includes(wanted.toLowerCase())
  }
  if (field?.fieldType === consentFieldTypeValues.multiSelect) {
    return Array.isArray(value)
      && value.some(item => String(item).trim() === wanted)
  }

  return String(value ?? '').trim().toLowerCase()
    === wanted.toLowerCase()
}

export function isConsentFieldRequired(field, fields, valuesByKey) {
  if (field?.required) {
    return true
  }
  const whenField = String(field?.requiredWhenField ?? '').trim()
  const whenValue = String(field?.requiredWhenValue ?? '').trim()
  if (!whenField || !whenValue) {
    return false
  }
  const trigger = (Array.isArray(fields) ? fields : []).find(
    item => item.key === whenField,
  )

  return valueMatchesCondition(
    trigger,
    valuesByKey?.[whenField],
    whenValue,
  )
}

export function missingRequiredConsentFields(fields, valuesByKey) {
  const list = Array.isArray(fields) ? fields : []

  return list.filter(field => (
    isConsentFieldRequired(field, list, valuesByKey)
    && !consentFieldHasValue(field, valuesByKey?.[field.key])
  ))
}

export function buildConsentFieldValueWrites(fields, valuesByKey) {
  return (Array.isArray(fields) ? fields : [])
    .filter(field => field?.key)
    .map(field => ({
      key: field.key,
      value: valuesByKey?.[field.key]
        ?? emptyValueForConsentField(field.fieldType),
    }))
}

export function valuesByKeyFromConsentFields(fields) {
  const map = {}
  for (const field of Array.isArray(fields) ? fields : []) {
    if (!field?.key) {
      continue
    }
    map[field.key] = field.value
      ?? emptyValueForConsentField(field.fieldType)
  }

  return map
}
