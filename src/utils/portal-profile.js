export function emptyAddress() {
  return {
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
  }
}

export function emptyEmergency() {
  return {
    firstName: '',
    lastName: '',
    relationship: '',
    phone: '',
  }
}

export function emptyInsurance() {
  return {
    id: null,
    payerPlanName: '',
    memberId: '',
    effectiveUs: '',
    expirationUs: '',
  }
}

export function emptyChart() {
  return {
    sex: '',
    preferredLanguage: '',
    communicationPreference: '',
    address: emptyAddress(),
    emergency: emptyEmergency(),
    insurance: emptyInsurance(),
    noAllergies: false,
    allergies: [],
  }
}

export function sexOptions(t) {
  return [
    { value: 'male', label: t('sexMale') },
    { value: 'female', label: t('sexFemale') },
    { value: 'other', label: t('sexOther') },
  ]
}

export function languageOptions(t) {
  return [
    { value: 'english', label: t('languageEnglish') },
    { value: 'spanish', label: t('languageSpanish') },
  ]
}

export function communicationOptions(t) {
  return [
    {
      value: 'mobile_phone',
      label: t('commSms'),
      hint: t('commSmsHint'),
    },
    {
      value: 'home_phone',
      label: t('commCall'),
      hint: t('commCallHint'),
    },
    {
      value: 'email',
      label: t('commEmail'),
      hint: t('commEmailHint'),
    },
  ]
}

export function relationshipOptions(t) {
  return [
    { value: 'spouse', label: t('relationshipSpouse') },
    { value: 'father', label: t('relationshipFather') },
    { value: 'mother', label: t('relationshipMother') },
    { value: 'brother', label: t('relationshipBrother') },
    { value: 'sister', label: t('relationshipSister') },
    { value: 'son', label: t('relationshipSon') },
    { value: 'daughter', label: t('relationshipDaughter') },
    { value: 'aunt', label: t('relationshipAunt') },
    { value: 'uncle', label: t('relationshipUncle') },
    { value: 'cousin', label: t('relationshipCousin') },
  ]
}

export function severityOptions(t) {
  return [
    { value: 'mild', label: t('severityMild') },
    { value: 'moderate', label: t('severityModerate') },
    { value: 'severe', label: t('severitySevere') },
    {
      value: 'life_threatening',
      label: t('severityLifeThreatening'),
    },
  ]
}

export function emptyAllergyRow() {
  return {
    id: null,
    name: '',
    severity: 'mild',
  }
}

export function chartFromProfile(data, isoDateToUsDate) {
  const address = data?.address || {}
  const emergency = data?.emergency_contact || {}
  const insurance = data?.insurance || {}
  const allergies = Array.isArray(data?.allergies)
    ? data.allergies
    : []
  return {
    sex: data?.sex || '',
    preferredLanguage: data?.preferred_language || '',
    communicationPreference:
      data?.communication_preference || '',
    address: {
      line1: address.line1 || '',
      line2: address.line2 || '',
      city: address.city || '',
      state: address.state || '',
      zip: address.zip || '',
    },
    emergency: {
      firstName: emergency.first_name || '',
      lastName: emergency.last_name || '',
      relationship: emergency.relationship || '',
      phone: emergency.phone || '',
    },
    insurance: {
      id: insurance.id ?? null,
      payerPlanName: insurance.payer_plan_name || '',
      memberId: insurance.member_id || '',
      effectiveUs: isoDateToUsDate(
        insurance.policy_effective_date,
      ),
      expirationUs: isoDateToUsDate(
        insurance.policy_expiration_date,
      ),
    },
    noAllergies: Boolean(data?.no_allergies)
      && allergies.length === 0,
    allergies: allergies.map((row) => ({
      id: row?.id ?? null,
      name: row?.name || '',
      severity: row?.severity || '',
    })),
  }
}

export function chartToRequest(chart, usDateToIsoDate) {
  const allergies = (chart.allergies || [])
    .map((row) => ({
      id: row.id || undefined,
      name: String(row.name || '').trim(),
      severity: row.severity || null,
    }))
    .filter((row) => row.name)
  return {
    sex: chart.sex || null,
    preferredLanguage: chart.preferredLanguage || null,
    communicationPreference:
      chart.communicationPreference || null,
    address: { ...chart.address },
    emergencyContact: { ...chart.emergency },
    insurance: {
      id: chart.insurance.id || undefined,
      payerPlanName: chart.insurance.payerPlanName,
      memberId: chart.insurance.memberId,
      policyEffectiveDate: usDateToIsoDate(
        chart.insurance.effectiveUs,
      ) || null,
      policyExpirationDate: usDateToIsoDate(
        chart.insurance.expirationUs,
      ) || null,
    },
    noAllergies: Boolean(chart.noAllergies) || !allergies.length,
    allergies: chart.noAllergies ? [] : allergies,
  }
}
