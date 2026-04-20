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
    };
    this._handleMessage = this._handleMessage.bind(this);
    this._reconnectTimer = null;
    this._shouldReconnect = false;
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
          this._emit('peerJoined', { role: msg.role });
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
        this._emit('signal', msg.data);
        break;

      case 'PEER_LEFT':
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
   * Leave the room
   */
  leave() {
    this._broadcast({ type: 'PEER_LEFT', roomCode: this.roomCode, role: this.role });
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
