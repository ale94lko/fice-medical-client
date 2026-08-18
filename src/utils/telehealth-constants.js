export const telehealthSessionStatuses = {
  scheduled: 'SCHEDULED',
  waitingRoom: 'WAITING_ROOM',
  ready: 'READY',
  inProgress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  failed: 'FAILED',
}

export const telehealthParticipantStatuses = {
  waiting: 'WAITING',
  admitted: 'ADMITTED',
  inSession: 'IN_SESSION',
  left: 'LEFT',
}

export const telehealthRoles = {
  clinician: 'CLINICIAN',
  client: 'CLIENT',
  guest: 'GUEST',
}

export const telehealthHeartbeatIntervalMs = 30000

export const telehealthChatBodyMaxLength = 4000
