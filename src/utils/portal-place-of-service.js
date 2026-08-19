const OFFICE_CODE = '11'
const TELEHEALTH_CODES = new Set(['02', '10'])

const PLACE_ICONS = {
  '01': 'local_pharmacy',
  '02': 'videocam',
  '03': 'school',
  '04': 'home',
  '09': 'gavel',
  '10': 'videocam',
  '11': 'business',
  '12': 'home',
  '13': 'apartment',
  '14': 'home',
  '15': 'local_shipping',
  '16': 'hotel',
  '17': 'storefront',
  '18': 'work',
  '19': 'local_hospital',
  '20': 'medical_services',
  '21': 'local_hospital',
  '22': 'local_hospital',
  '23': 'emergency',
  '24': 'local_hospital',
  '25': 'child_care',
  '26': 'military_tech',
  '31': 'hotel',
  '32': 'hotel',
  '33': 'home',
  '34': 'volunteer_activism',
  '41': 'airport_shuttle',
  '42': 'flight',
  '49': 'business',
  '50': 'business',
  '51': 'local_hospital',
  '52': 'local_hospital',
  '53': 'psychology',
  '57': 'healing',
  '58': 'healing',
  '65': 'local_hospital',
  '71': 'business',
  '72': 'business',
  '81': 'biotech',
  '99': 'place',
}

const PLACE_LABEL_KEYS = {
  '02': 'placeOfServiceTelehealth',
  '10': 'placeOfServiceTelehealth',
  '11': 'placeOfServiceOffice',
  '12': 'placeOfServiceHome',
  '03': 'placeOfServiceSchool',
}

function normalizePosCode(code) {
  const raw = String(code ?? '').trim().toUpperCase()
  if (/^\d$/.test(raw)) {
    return `0${raw}`
  }
  return raw
}

export function stripPlaceCode(value) {
  return String(value ?? '')
    .replace(/^\d{1,2}\s*[-–]\s*/, '')
    .trim()
}

export function portalPlaceLabel(item, t) {
  const code = normalizePosCode(item?.place_of_service_code)
  const key = PLACE_LABEL_KEYS[code]
  if (key) {
    return t(key)
  }
  const name = stripPlaceCode(item?.place_of_service_name)
  if (name) {
    return name
  }
  if (item?.telemedicine || TELEHEALTH_CODES.has(code)) {
    return t('placeOfServiceTelehealth')
  }
  return ''
}

export function portalPlaceIcon(item) {
  const code = normalizePosCode(item?.place_of_service_code)
  if (PLACE_ICONS[code]) {
    return PLACE_ICONS[code]
  }
  if (item?.telemedicine) {
    return 'videocam'
  }
  const name = String(item?.place_of_service_name || '').toLowerCase()
  if (name.includes('tele') || name.includes('virtual')) {
    return 'videocam'
  }
  if (name.includes('office') || name.includes('consult')) {
    return 'business'
  }
  if (name.includes('home') || name.includes('domicil')) {
    return 'home'
  }
  if (name.includes('school') || name.includes('escuel')) {
    return 'school'
  }
  if (name.includes('hospital')) {
    return 'local_hospital'
  }
  return 'place'
}

export function portalPlaceAddress(item) {
  const code = normalizePosCode(item?.place_of_service_code)
  if (code !== OFFICE_CODE) {
    return ''
  }
  return String(item?.location_address ?? '').trim()
}

export function toPortalPlaceFields(item, t) {
  const place = portalPlaceLabel(item, t)
  if (!place) {
    return {}
  }
  return {
    place,
    placeIcon: portalPlaceIcon(item),
    placeAddress: portalPlaceAddress(item),
  }
}
