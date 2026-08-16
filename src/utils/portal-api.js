export const portalPaths = {
  register: '/portal/v1/auth/register',
  login: '/portal/v1/auth/login',
  refresh: '/portal/v1/auth/refresh',
  logout: '/portal/v1/auth/logout',
  verifyEmail: '/portal/v1/auth/verify-email',
  passwordResetRequest: '/portal/v1/auth/password-reset/request',
  passwordResetConfirm: '/portal/v1/auth/password-reset/confirm',
  invitation: token => `/portal/v1/invitations/${encodeURIComponent(token)}`,
  invitationAccept: token => (
    `/portal/v1/invitations/${encodeURIComponent(token)}/accept`
  ),
  me: '/portal/v1/me',
  dashboard: '/portal/v1/dashboard',
  profile: '/portal/v1/profile',
}

export function unwrapData(body) {
  return body?.data ?? body
}
