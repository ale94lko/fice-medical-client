export const portalPaths = {
  register: '/portal/v1/auth/register',
  authLocations: '/portal/v1/auth/locations',
  login: '/portal/v1/auth/login',
  refresh: '/portal/v1/auth/refresh',
  logout: '/portal/v1/auth/logout',
  verifyEmail: '/portal/v1/auth/verify-email',
  verifyEmailRequest: '/portal/v1/auth/verify-email/request',
  passwordResetRequest: '/portal/v1/auth/password-reset/request',
  passwordResetConfirm: '/portal/v1/auth/password-reset/confirm',
  invitation: token => `/portal/v1/invitations/${encodeURIComponent(token)}`,
  invitationAccept: token => (
    `/portal/v1/invitations/${encodeURIComponent(token)}/accept`
  ),
  me: '/portal/v1/me',
  dashboard: '/portal/v1/dashboard',
  profile: '/portal/v1/profile',
  locations: '/portal/v1/locations',
  selectLocation: '/portal/v1/locations/select',
  appointments: '/portal/v1/appointments',
  appointment: (id) => `/portal/v1/appointments/${id}`,
  appointmentCancel: (id) => `/portal/v1/appointments/${id}/cancel`,
  appointmentReschedule: (id) => (
    `/portal/v1/appointments/${id}/reschedule`
  ),
  appointmentServices: '/portal/v1/appointments/services',
  appointmentAvailability: '/portal/v1/appointments/availability',
  appointmentBook: '/portal/v1/appointments/book',
  appointmentRequests: '/portal/v1/appointments/requests',
  appointmentRequestCancel: (id) => (
    `/portal/v1/appointments/requests/${id}/cancel`
  ),
  appointmentTelehealth: (id) => (
    `/portal/v1/appointments/${id}/telehealth`
  ),
  appointmentTelehealthJoin: (id) => (
    `/portal/v1/appointments/${id}/telehealth/join`
  ),
  appointmentTelehealthSession: (id) => (
    `/portal/v1/appointments/${id}/telehealth/session`
  ),
  appointmentTelehealthReady: (id) => (
    `/portal/v1/appointments/${id}/telehealth/waiting-room/ready`
  ),
  appointmentTelehealthHeartbeat: (id) => (
    `/portal/v1/appointments/${id}/telehealth/heartbeat`
  ),
  appointmentTelehealthLeave: (id) => (
    `/portal/v1/appointments/${id}/telehealth/leave`
  ),
  appointmentTelehealthChat: (id) => (
    `/portal/v1/appointments/${id}/telehealth/chat`
  ),
  bookingOptions: '/portal/v1/booking/options',
  bookingServices: '/portal/v1/booking/services',
  bookingClinicians: '/portal/v1/booking/clinicians',
  bookingAvailability: '/portal/v1/booking/availability',
  bookingConfirm: '/portal/v1/booking/confirm',
  consents: '/portal/v1/consents',
  consent: (id) => `/portal/v1/consents/${id}`,
  consentSign: (id) => `/portal/v1/consents/${id}/sign`,
  consentDecline: (id) => `/portal/v1/consents/${id}/decline`,
  messagesConversation: '/portal/v1/messages/conversation',
  messagesUnreadCount: '/portal/v1/messages/unread-count',
  messagesList: '/portal/v1/messages/conversation/messages',
  messagesSend: '/portal/v1/messages/conversation/messages',
  messagesFiles: '/portal/v1/messages/conversation/files',
  messagesRead: '/portal/v1/messages/conversation/read',
  messagesFile: (id) => `/portal/v1/messages/files/${id}`,
}

export function unwrapData(body) {
  return body?.data ?? body
}
