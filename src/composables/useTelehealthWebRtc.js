import { ref, shallowRef } from 'vue'

function stopTrack(track) {
  try {
    track?.stop?.()
  } catch {
    // ignore
  }
}

function stopStream(stream) {
  if (!stream) {
    return
  }
  stream.getTracks().forEach(stopTrack)
}

/** Clear a stream ref without stopping inbound (remote) tracks. */
function detachStream(streamRef) {
  streamRef.value = null
}

function unwrapSignalPayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  const nested = raw.data
  if (
    nested
    && typeof nested === 'object'
    && !Array.isArray(nested)
    && raw.type == null
    && (nested.type != null || nested.sdp != null || nested.candidate != null)
  ) {
    return nested
  }

  return raw
}

function resolveSdp(payload) {
  if (!payload || typeof payload !== 'object') {
    return ''
  }

  return String(
    payload.sdp
    ?? payload.session_description
    ?? payload.sessionDescription
    ?? payload.description
    ?? '',
  ).trim()
}

function normalizeSignalType(rawType) {
  return String(rawType ?? '')
    .toLowerCase()
    .replace(/_/g, '-')
}

function normalizeIceCandidateInit(raw) {
  if (raw == null) {
    return null
  }
  if (typeof raw === 'string') {
    return { candidate: raw }
  }
  if (typeof raw !== 'object') {
    return null
  }
  const line = String(raw.candidate ?? '').trim()
  if (!line) {
    return null
  }
  const mid = raw.sdpMid ?? raw.sdp_mid
  const mLine = raw.sdpMLineIndex ?? raw.sdp_m_line_index
  const ufrag = raw.usernameFragment ?? raw.username_fragment
  const init = { candidate: line }
  if (mid != null && mid !== '') {
    init.sdpMid = String(mid)
  }
  if (mLine != null && mLine !== '') {
    const n = Number(mLine)
    if (Number.isFinite(n)) {
      init.sdpMLineIndex = n
    }
  }
  if (ufrag != null && ufrag !== '') {
    init.usernameFragment = String(ufrag)
  }

  return init
}

function resolveIceServers(iceServers = []) {
  if (Array.isArray(iceServers) && iceServers.length) {
    return iceServers
  }
  // Fallback STUN so peers behind NAT can still gather candidates
  // when the session payload omits ice_servers.
  return [{ urls: 'stun:stun.l.google.com:19302' }]
}

function createWebRtcRuntime() {
  return {
    localStream: shallowRef(null),
    remoteStream: shallowRef(null),
    remoteScreenStream: shallowRef(null),
    screenStream: shallowRef(null),
    connectionState: ref('new'),
    iceConnectionState: ref('new'),
    audioEnabled: ref(true),
    videoEnabled: ref(true),
    speakerEnabled: ref(true),
    isScreenSharing: ref(false),
    isRemoteScreenSharing: ref(false),
    remoteMediaGeneration: ref(0),
    mut: {
      pc: null,
      selfParticipantId: null,
      remoteParticipantId: null,
      sendSignal: null,
      screenSender: null,
      makingOffer: false,
      renegotiateQueued: false,
      ignoreOffer: false,
      polite: false,
      offerArmed: false,
      pendingIceCandidates: [],
      pendingSignals: [],
      remoteScreenStreamId: null,
      remoteTrackStreamIds: new Map(),
    },
  }
}

function bindRemoteMedia(rt) {
  const { mut } = rt

  function bumpRemoteMedia() {
    rt.remoteMediaGeneration.value += 1
  }

  function publishStream(targetRef, stream, { bump = false } = {}) {
    // New MediaStream identity so Vue shallowRef consumers update.
    targetRef.value = new MediaStream(stream.getTracks())
    if (bump) {
      bumpRemoteMedia()
    }
  }

  function ensureRemoteStream() {
    if (!rt.remoteStream.value) {
      rt.remoteStream.value = new MediaStream()
      bumpRemoteMedia()
    }

    return rt.remoteStream.value
  }

  function ensureRemoteScreenStream() {
    if (!rt.remoteScreenStream.value) {
      rt.remoteScreenStream.value = new MediaStream()
      bumpRemoteMedia()
    }

    return rt.remoteScreenStream.value
  }

  function clearRemoteScreenStream() {
    detachStream(rt.remoteScreenStream)
    bumpRemoteMedia()
  }

  function remoteHasCameraVideo() {
    return Boolean(
      rt.remoteStream.value
        ?.getVideoTracks?.()
        ?.some(track => track && track.readyState !== 'ended'),
    )
  }

  function shouldTreatAsScreenTrack(track, inboundStream) {
    const streamId = inboundStream?.id
      || mut.remoteTrackStreamIds.get(track?.id)
    if (
      mut.remoteScreenStreamId
      && streamId
      && streamId === mut.remoteScreenStreamId
    ) {
      return true
    }
    // Do not guess screen tracks unless a remote share was announced —
    // otherwise a normal camera can be mis-routed and "disappear".
    if (!rt.isRemoteScreenSharing.value && !mut.remoteScreenStreamId) {
      return false
    }
    const hint = String(track?.contentHint ?? '').toLowerCase()
    if (hint === 'detail' || hint === 'text') {
      return true
    }
    if (remoteHasCameraVideo()) {
      return true
    }

    return false
  }

  function moveTrackToScreen(track) {
    if (!track || track.kind !== 'video') {
      return
    }
    if (rt.remoteStream.value?.getTracks?.().some(t => t.id === track.id)) {
      try {
        rt.remoteStream.value.removeTrack(track)
        publishStream(rt.remoteStream, rt.remoteStream.value, { bump: true })
      } catch {
        // ignore
      }
    }
    const stream = ensureRemoteScreenStream()
    if (!stream.getTracks().some(t => t.id === track.id)) {
      stream.addTrack(track)
    }
    publishStream(rt.remoteScreenStream, stream, { bump: true })
    rt.isRemoteScreenSharing.value = true
  }

  function reclassifyRemoteScreenTracks() {
    if (!mut.remoteScreenStreamId || !rt.remoteStream.value) {
      return
    }
    rt.remoteStream.value.getVideoTracks().forEach(track => {
      if (mut.remoteTrackStreamIds.get(track.id) === mut.remoteScreenStreamId) {
        moveTrackToScreen(track)
      }
    })
  }

  function attachRemoteTrack(track, inboundStream) {
    if (!track) {
      return
    }
    if (inboundStream?.id) {
      mut.remoteTrackStreamIds.set(track.id, inboundStream.id)
    }
    const isScreenVideo = track.kind === 'video'
      && shouldTreatAsScreenTrack(track, inboundStream)
    if (isScreenVideo) {
      moveTrackToScreen(track)
      track.addEventListener('ended', () => {
        clearRemoteScreenStream()
        mut.remoteTrackStreamIds.delete(track.id)
        if (!rt.isScreenSharing.value && !mut.remoteScreenStreamId) {
          rt.isRemoteScreenSharing.value = false
        }
        bumpRemoteMedia()
      })

      return
    }
    const stream = ensureRemoteStream()
    if (!stream.getTracks().some(t => t.id === track.id)) {
      stream.addTrack(track)
    }
    publishStream(rt.remoteStream, stream, { bump: true })
    track.addEventListener('ended', () => {
      mut.remoteTrackStreamIds.delete(track.id)
      bumpRemoteMedia()
    })
  }

  function setRemoteScreenSharing(active, streamId = null) {
    const nextActive = Boolean(active)
    rt.isRemoteScreenSharing.value = nextActive
    if (!nextActive) {
      mut.remoteScreenStreamId = null
      clearRemoteScreenStream()

      return
    }
    if (streamId) {
      mut.remoteScreenStreamId = String(streamId)
      reclassifyRemoteScreenTracks()
    }
  }

  Object.assign(rt, {
    bumpRemoteMedia,
    clearRemoteScreenStream,
    attachRemoteTrack,
    setRemoteScreenSharing,
  })
}

function bindPeerConnection(rt) {
  const { mut } = rt

  function flushPendingSignals() {
    if (!mut.pendingSignals.length || !mut.pc) {
      return
    }
    const queued = mut.pendingSignals
    mut.pendingSignals = []
    queued.forEach(msg => {
      void handleSignal(msg)
    })
  }

  function bindPeerHandlers() {
    mut.pc.onicecandidate = event => {
      if (!event.candidate || !mut.sendSignal) {
        return
      }
      mut.sendSignal({
        type: 'ice-candidate',
        candidate: event.candidate.toJSON(),
        fromParticipantId: mut.selfParticipantId,
        toParticipantId: mut.remoteParticipantId,
      })
    }

    mut.pc.ontrack = event => {
      rt.attachRemoteTrack(event.track, event.streams?.[0] ?? null)
    }

    mut.pc.onnegotiationneeded = () => {
      // 1:1 telehealth: only the impolite peer (clinician) offers, and
      // only after offerArmed (peer_ready / explicit offer).
      if (mut.polite || !mut.offerArmed) {
        return
      }
      void renegotiate()
    }

    mut.pc.onconnectionstatechange = () => {
      rt.connectionState.value = mut.pc?.connectionState || 'closed'
    }

    mut.pc.oniceconnectionstatechange = () => {
      rt.iceConnectionState.value = mut.pc?.iceConnectionState || 'closed'
    }
  }

  function createPeerConnection(iceServers = []) {
    closePeerConnection({ keepLocal: true })
    mut.pc = new RTCPeerConnection({
      iceServers: resolveIceServers(iceServers),
    })
    rt.connectionState.value = mut.pc.connectionState || 'new'
    rt.iceConnectionState.value = mut.pc.iceConnectionState || 'new'
    bindPeerHandlers()
    if (rt.localStream.value) {
      rt.localStream.value.getTracks().forEach(track => {
        mut.pc.addTrack(track, rt.localStream.value)
      })
    }
    applyScreenShareToPeer()
    flushPendingSignals()

    return mut.pc
  }

  async function createAndSendOffer() {
    if (!mut.pc || !mut.sendSignal || mut.polite) {
      return false
    }
    mut.offerArmed = true
    if (mut.makingOffer || mut.pc.signalingState !== 'stable') {
      mut.renegotiateQueued = true

      return false
    }
    mut.makingOffer = true
    try {
      const offer = await mut.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      if (!mut.pc || mut.pc.signalingState !== 'stable') {
        mut.renegotiateQueued = true

        return false
      }
      await mut.pc.setLocalDescription(offer)
      mut.sendSignal({
        type: 'offer',
        sdp: mut.pc.localDescription?.sdp || offer.sdp,
        fromParticipantId: mut.selfParticipantId,
        toParticipantId: mut.remoteParticipantId,
      })

      return true
    } catch {
      return false
    } finally {
      mut.makingOffer = false
      if (mut.renegotiateQueued && mut.pc?.signalingState === 'stable') {
        mut.renegotiateQueued = false
        void renegotiate()
      }
    }
  }

  async function renegotiate() {
    await createAndSendOffer()
  }

  function applyScreenShareToPeer() {
    if (!mut.pc || !rt.isScreenSharing.value || !rt.screenStream.value) {
      return
    }
    const displayTrack = rt.screenStream.value.getVideoTracks()[0]
    if (!displayTrack || displayTrack.readyState === 'ended') {
      return
    }
    // Keep camera sender; screen is a separate "participant" track.
    const alreadySending = mut.pc.getSenders().some(
      sender => sender.track && sender.track.id === displayTrack.id,
    )
    if (alreadySending) {
      mut.screenSender = mut.pc.getSenders().find(
        sender => sender.track?.id === displayTrack.id,
      ) || mut.screenSender

      return
    }
    mut.screenSender = mut.pc.addTrack(displayTrack, rt.screenStream.value)
    // Only the clinician (impolite) drives offers; guest screen share
    // relies on a peer_ready-style renegotiation from the clinician.
    if (!mut.polite) {
      void renegotiate()
    }
  }

  function preparePeer({
    iceServers,
    selfId,
    remoteId,
    publishSignal,
    isPolite = false,
  }) {
    mut.selfParticipantId = selfId
    mut.remoteParticipantId = remoteId
    mut.sendSignal = publishSignal
    mut.polite = Boolean(isPolite)
    createPeerConnection(iceServers)
  }

  /**
   * @param {object} options
   * @param {boolean} [options.offerImmediately] — clinician should wait for
   *   peer_ready before the first offer (default: !isPolite).
   */
  async function startCall({
    iceServers,
    selfId,
    remoteId,
    publishSignal,
    isPolite = false,
    offerImmediately,
  }) {
    preparePeer({
      iceServers,
      selfId,
      remoteId,
      publishSignal,
      isPolite,
    })
    const shouldOffer = offerImmediately == null
      ? !mut.polite
      : Boolean(offerImmediately)
    // addTrack fires negotiationneeded — keep disarmed until we mean to offer.
    mut.offerArmed = false
    if (shouldOffer) {
      await createAndSendOffer()
    }
  }

  async function handleSignal(payload) {
    const msg = unwrapSignalPayload(payload)
    if (!msg) {
      return
    }
    if (!mut.pc) {
      mut.pendingSignals.push(msg)

      return
    }
    try {
      await handleSignalInner(msg)
    } catch {
      // Swallow SDP races (duplicate answer, glare, closed PC).
    }
  }

  async function flushPendingIceCandidates() {
    if (!mut.pc?.remoteDescription || !mut.pendingIceCandidates.length) {
      return
    }
    const queued = mut.pendingIceCandidates
    mut.pendingIceCandidates = []
    for (const candidate of queued) {
      try {
        await mut.pc.addIceCandidate(candidate)
      } catch {
        // ignore stale candidates after glare / restart
      }
    }
  }

  function shouldDropSignal(type, fromId, toId) {
    if (
      Number.isFinite(toId)
      && mut.selfParticipantId != null
      && toId !== Number(mut.selfParticipantId)
    ) {
      return true
    }
    if (
      Number.isFinite(fromId)
      && mut.remoteParticipantId != null
      && fromId !== Number(mut.remoteParticipantId)
      && (type === 'offer' || type === 'answer' || type === 'ice-candidate')
    ) {
      // Allow first remote id assignment from inbound offer.
      if (type === 'offer' && mut.remoteParticipantId == null) {
        mut.remoteParticipantId = fromId
      } else if (type !== 'offer') {
        return true
      }
    }

    return false
  }

  async function handleOfferSignal(payload, fromId) {
    // Clinician never accepts remote offers (sole offerer).
    if (!mut.polite) {
      return
    }
    if (Number.isFinite(fromId)) {
      mut.remoteParticipantId = fromId
    }
    const sdp = resolveSdp(payload)
    if (!sdp) {
      return
    }
    const offerCollision = mut.makingOffer
      || mut.pc.signalingState !== 'stable'
    if (offerCollision) {
      if (!mut.polite) {
        mut.ignoreOffer = true

        return
      }
      try {
        await mut.pc.setLocalDescription({ type: 'rollback' })
      } catch {
        // ignore if rollback unsupported / unnecessary
      }
    }
    mut.ignoreOffer = false
    await mut.pc.setRemoteDescription({
      type: 'offer',
      sdp,
    })
    await flushPendingIceCandidates()
    const answer = await mut.pc.createAnswer()
    await mut.pc.setLocalDescription(answer)
    mut.sendSignal?.({
      type: 'answer',
      sdp: answer.sdp,
      fromParticipantId: mut.selfParticipantId,
      toParticipantId: fromId || mut.remoteParticipantId,
    })
  }

  async function handleAnswerSignal(payload) {
    // Duplicate / late answers arrive after negotiation already finished.
    if (mut.pc.signalingState !== 'have-local-offer') {
      return
    }
    const sdp = resolveSdp(payload)
    if (!sdp) {
      return
    }
    await mut.pc.setRemoteDescription({
      type: 'answer',
      sdp,
    })
    await flushPendingIceCandidates()
    if (mut.renegotiateQueued && mut.pc.signalingState === 'stable') {
      mut.renegotiateQueued = false
      void renegotiate()
    }
  }

  async function handleIceCandidateSignal(payload) {
    const init = normalizeIceCandidateInit(
      payload.candidate ?? payload.ice_candidate ?? payload.iceCandidate,
    )
    if (!init) {
      return
    }
    if (!mut.pc.remoteDescription) {
      mut.pendingIceCandidates.push(init)

      return
    }
    try {
      await mut.pc.addIceCandidate(init)
    } catch {
      if (!mut.ignoreOffer) {
        // swallow races during glare
      }
    }
  }

  async function handleSignalInner(payload) {
    if (!payload || typeof payload !== 'object' || !mut.pc) {
      return
    }
    const type = normalizeSignalType(payload.type)
    const fromId = Number(
      payload.from_participant_id ?? payload.fromParticipantId,
    )
    const toId = Number(
      payload.to_participant_id ?? payload.toParticipantId,
    )
    if (shouldDropSignal(type, fromId, toId)) {
      return
    }
    if (type === 'offer') {
      await handleOfferSignal(payload, fromId)

      return
    }
    if (type === 'answer') {
      await handleAnswerSignal(payload)

      return
    }
    if (type === 'ice-candidate') {
      await handleIceCandidateSignal(payload)
    }
  }

  function closePeerConnection({ keepLocal = false } = {}) {
    if (mut.pc) {
      try {
        mut.pc.onicecandidate = null
        mut.pc.ontrack = null
        mut.pc.onnegotiationneeded = null
        mut.pc.onconnectionstatechange = null
        mut.pc.oniceconnectionstatechange = null
        mut.pc.close()
      } catch {
        // ignore
      }
      mut.pc = null
    }
    // Do not stop() inbound remote tracks — only detach UI refs.
    detachStream(rt.remoteStream)
    rt.clearRemoteScreenStream()
    rt.isRemoteScreenSharing.value = false
    mut.remoteScreenStreamId = null
    mut.remoteTrackStreamIds.clear()
    rt.bumpRemoteMedia()
    if (!keepLocal) {
      stopStream(rt.localStream.value)
      rt.localStream.value = null
    }
    stopStream(rt.screenStream.value)
    rt.screenStream.value = null
    mut.screenSender = null
    rt.isScreenSharing.value = false
    rt.connectionState.value = 'closed'
    rt.iceConnectionState.value = 'closed'
    mut.makingOffer = false
    mut.renegotiateQueued = false
    mut.ignoreOffer = false
    mut.offerArmed = false
    mut.pendingIceCandidates = []
    mut.pendingSignals = []
  }

  function hasPeerConnection() {
    return Boolean(mut.pc)
  }

  function cleanup() {
    closePeerConnection({ keepLocal: false })
    mut.sendSignal = null
    mut.selfParticipantId = null
    mut.remoteParticipantId = null
  }

  Object.assign(rt, {
    preparePeer,
    startCall,
    createAndSendOffer,
    handleSignal,
    createPeerConnection,
    closePeerConnection,
    applyScreenShareToPeer,
    hasPeerConnection,
    cleanup,
  })
}

function bindLocalControls(rt) {
  const { mut } = rt

  async function getLocalMedia(constraints = { audio: true, video: true }) {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    rt.localStream.value = stream
    rt.audioEnabled.value = stream.getAudioTracks().some(t => t.enabled)
    rt.videoEnabled.value = stream.getVideoTracks().some(t => t.enabled)

    return stream
  }

  /** Take ownership of an existing MediaStream (e.g. lobby preview). */
  function adoptLocalStream(stream, options = {}) {
    if (!stream) {
      return null
    }
    if (rt.localStream.value && rt.localStream.value !== stream) {
      stopStream(rt.localStream.value)
    }
    rt.localStream.value = stream
    const nextAudio = options.audioEnabled
    const nextVideo = options.videoEnabled
    rt.audioEnabled.value = nextAudio == null
      ? stream.getAudioTracks().some(t => t.enabled)
      : Boolean(nextAudio)
    rt.videoEnabled.value = nextVideo == null
      ? stream.getVideoTracks().some(t => t.enabled)
      : Boolean(nextVideo)
    if (options.speakerEnabled != null) {
      rt.speakerEnabled.value = Boolean(options.speakerEnabled)
    }
    stream.getAudioTracks().forEach(track => {
      track.enabled = rt.audioEnabled.value
    })
    stream.getVideoTracks().forEach(track => {
      track.enabled = rt.videoEnabled.value
    })

    return stream
  }

  function setAudioEnabled(enabled) {
    rt.audioEnabled.value = Boolean(enabled)
    rt.localStream.value?.getAudioTracks().forEach(track => {
      track.enabled = rt.audioEnabled.value
    })
  }

  function setVideoEnabled(enabled) {
    rt.videoEnabled.value = Boolean(enabled)
    rt.localStream.value?.getVideoTracks().forEach(track => {
      track.enabled = rt.videoEnabled.value
    })
  }

  function toggleAudio() {
    setAudioEnabled(!rt.audioEnabled.value)
  }

  function toggleVideo() {
    setVideoEnabled(!rt.videoEnabled.value)
  }

  function setSpeakerEnabled(enabled) {
    rt.speakerEnabled.value = Boolean(enabled)
  }

  function toggleSpeaker() {
    setSpeakerEnabled(!rt.speakerEnabled.value)
  }

  async function acquireDisplayMedia() {
    try {
      return await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
        // Avoid offering this call tab when the browser supports it.
        selfBrowserSurface: 'exclude',
        preferCurrentTab: false,
      })
    } catch (error) {
      const name = String(error?.name ?? '')
      if (name === 'NotAllowedError' || name === 'AbortError') {
        throw error
      }

      return navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })
    }
  }

  async function startScreenShare({ onStarted } = {}) {
    if (rt.isScreenSharing.value) {
      return rt.screenStream.value
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Screen share is not supported in this browser')
    }
    const display = await acquireDisplayMedia()
    const displayTrack = display.getVideoTracks()[0]
    if (!displayTrack) {
      stopStream(display)
      throw new Error('No screen video track available')
    }
    try {
      displayTrack.contentHint = 'detail'
    } catch {
      // contentHint is best-effort
    }
    rt.screenStream.value = display
    rt.isScreenSharing.value = true
    displayTrack.onended = () => {
      stopScreenShare()
    }
    rt.applyScreenShareToPeer()
    onStarted?.()

    return display
  }

  async function stopScreenShare({ onStopped } = {}) {
    if (!rt.isScreenSharing.value) {
      return
    }
    if (mut.pc && mut.screenSender) {
      try {
        mut.pc.removeTrack(mut.screenSender)
      } catch {
        // ignore
      }
    }
    mut.screenSender = null
    stopStream(rt.screenStream.value)
    rt.screenStream.value = null
    rt.isScreenSharing.value = false
    onStopped?.()
  }

  Object.assign(rt, {
    getLocalMedia,
    adoptLocalStream,
    setAudioEnabled,
    setVideoEnabled,
    setSpeakerEnabled,
    toggleAudio,
    toggleVideo,
    toggleSpeaker,
    startScreenShare,
    stopScreenShare,
  })
}

/**
 * WebRTC peer connection for a 1:1 telehealth call.
 * Signaling payloads must be published by the caller (no PHI logging).
 */
export function useTelehealthWebRtc() {
  const rt = createWebRtcRuntime()
  bindRemoteMedia(rt)
  bindPeerConnection(rt)
  bindLocalControls(rt)

  return {
    localStream: rt.localStream,
    remoteStream: rt.remoteStream,
    remoteScreenStream: rt.remoteScreenStream,
    screenStream: rt.screenStream,
    connectionState: rt.connectionState,
    iceConnectionState: rt.iceConnectionState,
    remoteMediaGeneration: rt.remoteMediaGeneration,
    audioEnabled: rt.audioEnabled,
    videoEnabled: rt.videoEnabled,
    speakerEnabled: rt.speakerEnabled,
    isScreenSharing: rt.isScreenSharing,
    isRemoteScreenSharing: rt.isRemoteScreenSharing,
    getLocalMedia: rt.getLocalMedia,
    adoptLocalStream: rt.adoptLocalStream,
    preparePeer: rt.preparePeer,
    startCall: rt.startCall,
    createAndSendOffer: rt.createAndSendOffer,
    handleSignal: rt.handleSignal,
    setAudioEnabled: rt.setAudioEnabled,
    setVideoEnabled: rt.setVideoEnabled,
    setSpeakerEnabled: rt.setSpeakerEnabled,
    toggleAudio: rt.toggleAudio,
    toggleVideo: rt.toggleVideo,
    toggleSpeaker: rt.toggleSpeaker,
    startScreenShare: rt.startScreenShare,
    stopScreenShare: rt.stopScreenShare,
    setRemoteScreenSharing: rt.setRemoteScreenSharing,
    createPeerConnection: rt.createPeerConnection,
    closePeerConnection: rt.closePeerConnection,
    applyScreenShareToPeer: rt.applyScreenShareToPeer,
    hasPeerConnection: rt.hasPeerConnection,
    cleanup: rt.cleanup,
  }
}
