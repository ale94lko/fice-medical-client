import { api } from 'boot/axios'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import {
  mapChatMessagesFromApi,
  normalizeTelehealthChatMessage,
  normalizeTelehealthSession,
} from 'src/utils/telehealth-normalize.js'

let appointmentId = null

export function setPortalAppointmentId(id) {
  const n = Number(id)
  appointmentId = Number.isFinite(n) ? n : null
}

export function getPortalAppointmentId() {
  return appointmentId
}

function requireAppointmentId() {
  if (appointmentId == null) {
    throw new Error('Telehealth appointment id is required')
  }

  return appointmentId
}

function unwrapSession(body) {
  const data = unwrapData(body)
  if (
    data
    && typeof data === 'object'
    && !Array.isArray(data)
    && data.session
    && typeof data.session === 'object'
  ) {
    return data.session
  }

  return data
}

export function apiErrorMessage(err, fallback = 'Request failed') {
  const data = err?.response?.data
  const message = data?.error_description
    || data?.message
    || data?.error
    || err?.message

  return String(message || fallback)
}

async function getLobby() {
  const id = requireAppointmentId()
  const { data } = await api.get(portalPaths.appointmentTelehealth(id))

  return unwrapData(data)
}

export async function joinTelehealthSession(_sessionId, payload = {}) {
  const id = requireAppointmentId()
  const { data } = await api.post(
    portalPaths.appointmentTelehealthJoin(id),
    { displayName: payload.displayName },
  )

  return normalizeTelehealthSession(unwrapSession(data))
}

export async function getTelehealthSession() {
  const id = requireAppointmentId()
  const { data } = await api.get(
    portalPaths.appointmentTelehealthSession(id),
  )

  return normalizeTelehealthSession(unwrapSession(data))
}

export async function leaveTelehealthSession() {
  const id = requireAppointmentId()
  const { data } = await api.post(
    portalPaths.appointmentTelehealthLeave(id),
  )

  return normalizeTelehealthSession(unwrapSession(data))
}

export async function markWaitingRoomReady(_sessionId, payload = {}) {
  const id = requireAppointmentId()
  const { data } = await api.post(
    portalPaths.appointmentTelehealthReady(id),
    payload,
  )

  return unwrapData(data)
}

export async function sendTelehealthHeartbeat() {
  const id = requireAppointmentId()
  await api.post(portalPaths.appointmentTelehealthHeartbeat(id))
}

export async function listTelehealthChat() {
  const id = requireAppointmentId()
  const { data } = await api.get(portalPaths.appointmentTelehealthChat(id))

  return mapChatMessagesFromApi(unwrapData(data))
}

export async function postTelehealthChat(_sessionId, body) {
  const id = requireAppointmentId()
  const { data } = await api.post(
    portalPaths.appointmentTelehealthChat(id),
    { body },
  )

  return normalizeTelehealthChatMessage(unwrapData(data))
}

export const publicJoinTelehealth = joinTelehealthSession
export const publicGetTelehealthSession = getTelehealthSession
export const publicLeaveTelehealth = leaveTelehealthSession
export const publicMarkWaitingRoomReady = markWaitingRoomReady
export const publicSendTelehealthHeartbeat = sendTelehealthHeartbeat
export const publicListTelehealthChat = listTelehealthChat
export async function publicPostTelehealthChat(_auth, body) {
  return postTelehealthChat(null, body)
}

export async function fetchPortalTelehealthLobby() {
  return getLobby()
}

async function notSupported() {
  return null
}

export const admitTelehealthParticipant = notSupported
export const finishTelehealthSession = notSupported
export const startTelehealthSession = notSupported
export const startTelehealthScreenShare = notSupported
export const stopTelehealthScreenShare = notSupported
export const listTelehealthFiles = async() => []
export const uploadTelehealthFile = notSupported
export const deleteTelehealthFile = notSupported
export const downloadTelehealthFile = notSupported
export const deleteTelehealthChatMessage = notSupported
export const resendTelehealthClientInvite = notSupported
