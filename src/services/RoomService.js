/**
 * RoomService — Cross-tab/cross-machine communication layer
 * 
 * Two modes:
 * 1. LOCAL MODE (BroadcastChannel) — for two tabs on the same machine
 * 2. NETWORK MODE (WebSocket) — for two different computers on the same WiFi
 * 
 * The mode is auto-detected: if a WebSocket URL is configured, use network mode.
 * Otherwise, fall back to BroadcastChannel.
 */

const CHANNEL_NAME = 'qalana-interview-room';

class RoomService {
  constructor() {
    this.channel = null;   // BroadcastChannel (local mode)
    this.ws = null;        // WebSocket (network mode)
    this.mode = null;      // 'local' | 'network'
    this.roomCode = null;
    this.role = null;      // 'recruiter' | 'candidate'
    this.wsUrl = null;
    this.listeners = {
      transcript: [],
      takeover: [],
      peerJoined: [],
      peerLeft: [],
      signal: [],
      aiResponse: [],
      connectionStatus: [],
      typedMessage: [],
      stream: [],
    };
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this._handleMessage = this._handleMessage.bind(this);
    this._reconnectTimer = null;
    this._shouldReconnect = false;
    this.iceQueue = [];
  }

  /**
   * Initialize WebRTC Peer Connection
   */
  _initPeer(isCaller = false) {
    if (this.peerConnection) return;

    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      sdpSemantics: 'unified-plan'
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // When we get a remote stream, emit it
    this.peerConnection.ontrack = (event) => {
      console.log('[RoomService] Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        this.remoteStream.addTrack(event.track);
      }
      this._emit('stream', this.remoteStream);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log(`[RoomService] [${this.role}] ICE state:`, this.peerConnection.iceConnectionState);
      if (this.peerConnection.iceConnectionState === 'failed') {
        console.warn('[RoomService] ICE failed. Retrying in 2s...');
        setTimeout(() => {
          if (this.role === 'candidate') this.startStreaming(this.localStream);
          else this.sendSignal({ type: 'PING' });
        }, 2000);
      }
    };

    this.peerConnection.onicegatheringstatechange = () => {
      console.log(`[RoomService] [${this.role}] ICE Gathering:`, this.peerConnection.iceGatheringState);
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log(`[RoomService] [${this.role}] Connection state:`, state);
      this._emit('connectionStatus', { status: state });
      
      if (state === 'connected') {
        if (this._iceWatchdog) clearTimeout(this._iceWatchdog);
      }
      
      if (state === 'failed' || state === 'disconnected') {
        console.log('[RoomService] Connection lost. Attempting recovery...');
        if (this.role === 'candidate') {
          setTimeout(() => this.startStreaming(this.localStream), 2000);
        }
      }
    };

    // Watchdog to restart ICE if it gets stuck
    if (isCaller) {
      if (this._iceWatchdog) clearTimeout(this._iceWatchdog);
      this._iceWatchdog = setTimeout(() => {
        if (this.peerConnection && this.peerConnection.connectionState !== 'connected') {
          console.warn('[RoomService] ICE negotiation timed out. Restarting...');
          this.destroyPeerConnection();
          this._initPeer(true);
        }
      }, 8000);
    }

    this.peerConnection.onnegotiationneeded = () => {
      if (isCaller) {
        console.log('[RoomService] Negotiation needed, creating offer...');
        this._createOffer();
      }
    };

    // When we find local ICE candidates, send them
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[RoomService] [${this.role}] Local ICE found:`, event.candidate.type || 'unknown');
        this.sendSignal({
          type: 'ICE',
          candidate: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment
          }
        });
      }
    };

    if (this.localStream) {
      console.log(`[RoomService] [${this.role}] Adding ${this.localStream.getTracks().length} tracks to peer`);
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    } else if (isCaller) {
      this._createOffer();
    }
  }

  _createOffer() {
    if (!this.peerConnection) return;
    const offerOptions = { offerToReceiveAudio: true, offerToReceiveVideo: true };
    this.peerConnection.createOffer(offerOptions)
      .then(offer => this.peerConnection.setLocalDescription(offer))
      .then(() => {
        console.log('[RoomService] Sending OFFER');
        this.sendSignal({ type: 'OFFER', sdp: this.peerConnection.localDescription });
      })
      .catch(e => console.error('[RoomService] Offer creation error:', e));
  }

  /**
   * Generate a random room code like "QAL-X7K2"
   */
  _generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return `QAL-${code}`;
  }

  /**
   * Set the WebSocket server URL for network mode
   * Call this before createRoom/joinRoom to enable network mode
   * @param {string} url - e.g., 'ws://192.168.1.5:4000'
   */
  setServerUrl(url) {
    this.wsUrl = url;
  }

  /**
   * Check if we have a server URL configured
   */
  isNetworkMode() {
    return !!this.wsUrl;
  }

  /**
   * Create a new room (Recruiter side)
   */
  createRoom(role = 'recruiter') {
    this.roomCode = this._generateCode();
    this.role = role;

    if (this.wsUrl) {
      this.mode = 'network';
      this._initWebSocket();
    } else {
      this.mode = 'local';
      this._initChannel();
      this._broadcast({ type: 'ROOM_CREATED', roomCode: this.roomCode, role });
    }

    return this.roomCode;
  }

  /**
   * Join an existing room (Candidate side)
   */
  joinRoom(roomCode, role = 'candidate') {
    this.roomCode = roomCode.toUpperCase().trim();
    this.role = role;

    if (this.wsUrl) {
      this.mode = 'network';
      this._initWebSocket();
    } else {
      this.mode = 'local';
      this._initChannel();
      this._broadcast({ type: 'PEER_JOINED', roomCode: this.roomCode, role });
    }

    return true;
  }

  // ========== LOCAL MODE (BroadcastChannel) ==========

  _initChannel() {
    if (this.channel) {
      this.channel.close();
    }
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = (event) => this._handleMessage(event.data);
  }

  // ========== NETWORK MODE (WebSocket) ==========

  _initWebSocket() {
    if (this.ws) {
      this.ws.close();
    }

    this._shouldReconnect = true;
    
    try {
      this.ws = new WebSocket(this.wsUrl);
    } catch (err) {
      console.error('[RoomService] WebSocket connection failed:', err);
      this._emit('connectionStatus', { status: 'error', message: err.message });
      return;
    }

    this.ws.onopen = () => {
      console.log('[RoomService] WebSocket connected to', this.wsUrl);
      // Join the room on the server
      this.ws.send(JSON.stringify({
        type: 'JOIN',
        roomCode: this.roomCode,
        role: this.role
      }));
      this._emit('connectionStatus', { status: 'connected' });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._handleMessage(msg);
      } catch {
        // Ignore invalid messages
      }
    };

    this.ws.onclose = () => {
      console.log('[RoomService] WebSocket disconnected');
      this._emit('connectionStatus', { status: 'disconnected' });
      
      // Auto-reconnect
      if (this._shouldReconnect) {
        this._reconnectTimer = setTimeout(() => {
          console.log('[RoomService] Attempting reconnect...');
          this._initWebSocket();
        }, 2000);
      }
    };

    this.ws.onerror = (err) => {
      console.error('[RoomService] WebSocket error');
      this._emit('connectionStatus', { status: 'error' });
    };
  }

  // ========== SHARED MESSAGE HANDLING ==========

  _handleMessage(msg) {
    if (!msg || !msg.type) return;

    // Only process messages for our room
    if (msg.roomCode && msg.roomCode !== this.roomCode) return;

    switch (msg.type) {
      case 'PEER_JOINED':
        if (msg.role !== this.role) {
          console.log('[RoomService] Peer joined:', msg.role);
          this._emit('peerJoined', { role: msg.role });
          
          // If we are candidate and recruiter joins/rejoins, re-send our stream
          if (this.role === 'candidate' && this.localStream) {
            console.log('[RoomService] Candidate re-offering stream to new recruiter');
            this.destroyPeerConnection();
            this._initPeer(true);
          }

          // In local mode, send ack
          if (this.mode === 'local') {
            this._broadcast({ type: 'PEER_ACK', roomCode: this.roomCode, role: this.role });
          }
        }
        break;

      case 'PEER_ACK':
        if (msg.role !== this.role) {
          this._emit('peerJoined', { role: msg.role });
        }
        break;

      case 'TRANSCRIPT':
        this._emit('transcript', msg.data);
        break;

      case 'AI_RESPONSE':
        this._emit('aiResponse', msg.data);
        break;

      case 'TAKEOVER':
        this._emit('takeover', msg.data);
        break;

      case 'TYPED_MESSAGE':
        this._emit('typedMessage', msg.data);
        break;

      case 'SIGNAL':
        this._handleSignal(msg.data);
        break;

      case 'PEER_LEFT':
        this.destroyPeerConnection();
        this._emit('peerLeft', { role: msg.role });
        break;

      default:
        break;
    }
  }

  // ========== SEND METHODS ==========

  sendTranscript(text, sender, isFinal = true, isInterim = false) {
    this._broadcast({
      type: 'TRANSCRIPT',
      roomCode: this.roomCode,
      data: {
        text, sender, isFinal, isInterim,
        timestamp: Date.now(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }
    });
  }

  sendAIResponse(text) {
    this._broadcast({
      type: 'AI_RESPONSE',
      roomCode: this.roomCode,
      data: {
        text, sender: 'Sarah', isFinal: true,
        timestamp: Date.now(),
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }
    });
  }

  sendTypedMessage(text, sender = 'Sarah (Recruiter)') {
    this._broadcast({
      type: 'TYPED_MESSAGE',
      roomCode: this.roomCode,
      data: {
        text, sender, isFinal: true, isTyped: true,
        timestamp: Date.now(),
        id: `typed-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }
    });
  }

  sendTakeover() {
    this._broadcast({
      type: 'TAKEOVER',
      roomCode: this.roomCode,
      data: { timestamp: Date.now() }
    });
  }

  sendSignal(signalData) {
    this._broadcast({
      type: 'SIGNAL',
      roomCode: this.roomCode,
      data: signalData
    });
  }

  /**
   * Start streaming video/audio (Candidate side)
   */
  startStreaming(stream) {
    console.log('[RoomService] startStreaming called, roomCode:', this.roomCode);
    this.localStream = stream;
    if (this.roomCode) {
      // Clean slate — destroy any stale connection before creating a new one
      this.destroyPeerConnection();
      this._initPeer(true);
    }
  }

  /**
   * Handle WebRTC signaling messages
   */
  _handleSignal(data) {
    if (!data || !data.type) return;
    console.log(`[RoomService] [${this.role}] Signal received:`, data.type);

    if (data.type === 'OFFER') {
      console.log('[RoomService] Processing OFFER...');
      this.destroyPeerConnection();
      this._initPeer(false);
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp))
        .then(() => {
          console.log('[RoomService] Remote description set, processing ICE queue:', this.iceQueue.length);
          this.iceQueue.forEach(candidate => {
            this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
              .catch(e => console.warn('[RoomService] ICE queue processing error:', e));
          });
          this.iceQueue = [];
          
          const answerOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          };
          return this.peerConnection.createAnswer(answerOptions);
        })
        .then(answer => this.peerConnection.setLocalDescription(answer))
        .then(() => {
          console.log('[RoomService] Sending ANSWER');
          this.sendSignal({
            type: 'ANSWER',
            sdp: this.peerConnection.localDescription
          });
        })
        .catch(e => console.error('[RoomService] OFFER handling error:', e));
    } else if (data.type === 'ANSWER') {
      if (this.peerConnection) {
        console.log('[RoomService] Setting remote ANSWER...');
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp))
          .then(() => {
            console.log('[RoomService] Remote description (Answer) set, processing ICE queue:', this.iceQueue.length);
            this.iceQueue.forEach(candidate => {
              this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(e => console.warn('[RoomService] ICE queue processing error:', e));
            });
            this.iceQueue = [];
          })
          .catch(e => console.error('[RoomService] ANSWER handling error:', e));
      }
    } else if (data.type === 'ICE') {
      if (!data.candidate) return; // End of candidates
      if (this.peerConnection && this.peerConnection.remoteDescription) {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
          .catch(e => console.warn('[RoomService] ICE candidate error:', e));
      } else {
        console.log('[RoomService] Peer not ready for ICE, queueing candidate');
        this.iceQueue.push(data.candidate);
      }
    } else if (data.type === 'PING') {
      console.log('[RoomService] PING received, responding with PONG');
      this.sendSignal({ type: 'PONG' });
      // If we are the candidate, this is our cue to re-offer
      if (this.role === 'candidate' && this.localStream) {
        console.log('[RoomService] Candidate re-offering stream due to PING');
        this.destroyPeerConnection();
        this._initPeer(true);
      }
    } else if (data.type === 'PONG') {
      console.log('[RoomService] PONG received! Signaling path is ALIVE.');
    }
  }

  destroyPeerConnection() {
    if (this.peerConnection) {
      console.log(`[RoomService] [${this.role}] Destroying peer connection`);
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
    this.iceQueue = [];
  }

  /**
   * Leave the room
   */
  leave() {
    this._broadcast({ type: 'PEER_LEFT', roomCode: this.roomCode, role: this.role });
    this.destroyPeerConnection();
    this.destroy();
  }

  // ========== EVENT SYSTEM ==========

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  /**
   * Broadcast to the other side (via BroadcastChannel or WebSocket)
   */
  _broadcast(msg) {
    if (this.mode === 'network' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else if (this.mode === 'local' && this.channel) {
      this.channel.postMessage(msg);
    }
  }

  getRoomInfo() {
    return {
      roomCode: this.roomCode,
      role: this.role,
      mode: this.mode,
      isConnected: this.mode === 'network' ? (this.ws?.readyState === WebSocket.OPEN) : !!this.channel
    };
  }

  destroy() {
    this._shouldReconnect = false;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomCode = null;
    this.role = null;
    this.mode = null;
    Object.keys(this.listeners).forEach(key => {
      this.listeners[key] = [];
    });
  }
}

// Singleton instance
const roomService = new RoomService();
export default roomService;
