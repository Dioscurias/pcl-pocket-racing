import PeerModule from 'peerjs';

const DefaultPeer = typeof PeerModule === 'function' ? PeerModule : PeerModule.Peer ?? PeerModule.default;
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_PATTERN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;
const MAX_MESSAGE = 65536;
const MAX_BUFFER = 131072;
const TIMEOUT = 18000;
const env = import.meta.env ?? {};

function roomCode(value) {
  const result = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!CODE_PATTERN.test(result)) throw new Error('Enter a six-character invite code using letters and numbers.');
  return result;
}
function randomCode() {
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => ALPHABET[byte % ALPHABET.length]).join('');
}
function peerOptions() {
  const options = { debug: 0 };
  if (env.VITE_PEER_HOST) {
    options.host = env.VITE_PEER_HOST;
    options.port = Number(env.VITE_PEER_PORT || 443);
    options.path = env.VITE_PEER_PATH || '/';
    options.secure = env.VITE_PEER_SECURE !== 'false';
  }
  if (env.VITE_ICE_SERVERS) {
    let servers;
    try { servers = JSON.parse(env.VITE_ICE_SERVERS); } catch { throw new Error('The multiplayer ICE server configuration is invalid.'); }
    if (!Array.isArray(servers)) throw new Error('The multiplayer ICE server configuration must be an array.');
    options.config = { iceServers: servers };
  }
  return options;
}
function validJSON(value) {
  let nodes = 0;
  const visit = (item, depth) => {
    if (++nodes > 4096 || depth > 16) return false;
    if (item === null || typeof item === 'string' || typeof item === 'boolean') return true;
    if (typeof item === 'number') return Number.isFinite(item);
    if (typeof item !== 'object') return false;
    if (Array.isArray(item)) return item.every(child => visit(child, depth + 1));
    if (Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) return false;
    return Object.entries(item).every(([key, child]) => !['__proto__', 'prototype', 'constructor'].includes(key) && visit(child, depth + 1));
  };
  return value !== null && typeof value === 'object' && !Array.isArray(value) && visit(value, 0);
}
function encode(data) {
  try {
    if (!validJSON(data)) return null;
    const value = JSON.stringify(data);
    return value.length <= MAX_MESSAGE ? value : null;
  } catch { return null; }
}
function decode(data) {
  if (typeof data !== 'string' || data.length > MAX_MESSAGE) return null;
  try { const parsed = JSON.parse(data); return validJSON(parsed) ? parsed : null; } catch { return null; }
}
function friendlyError(error) {
  switch (error?.type) {
    case 'unavailable-id': return new Error('This invite code is already in use. Create a different room.');
    case 'peer-unavailable': return new Error('Room not found. Check the invite code and ask the host to keep the room open.');
    case 'network': case 'server-error': case 'socket-error': case 'socket-closed': return new Error('The multiplayer service could not be reached. Check your connection and retry.');
    case 'webrtc': return new Error('The peer connection failed. This network may require a configured TURN server.');
    case 'browser-incompatible': return new Error('This browser does not support the required WebRTC connection.');
    default: return new Error('The multiplayer connection failed. Please retry.');
  }
}

/**
 * Private WebRTC rooms. The host owns simulation; this class only transports JSON.
 * PeerJS Cloud provides signaling, not an authoritative game server. Restricted
 * NAT/firewall networks may need TURN via VITE_ICE_SERVERS (JSON array). Optional
 * VITE_PEER_HOST, VITE_PEER_PORT, VITE_PEER_PATH and VITE_PEER_SECURE select a
 * self-hosted signaling service. Never expose long-lived private TURN credentials.
 */
export class RoomConnection {
  constructor({ game = 'pond', onStatus = () => {}, onPeer = () => {}, onMessage = () => {}, onLeave = () => {}, PeerClass = DefaultPeer } = {}) {
    if (!/^[a-z0-9-]{1,32}$/.test(game)) throw new Error('Invalid multiplayer game namespace.');
    Object.assign(this, { game, onStatus, onPeer, onMessage, onLeave, PeerClass });
    this.id = ''; this.code = ''; this.isHost = false; this.connected = false;
    this.peers = new Map(); this.peer = null; this._connection = null; this._pending = null; this._generation = 0;
  }
  async host(code) {
    const normalized = code === undefined ? randomCode() : roomCode(code);
    await this._start(normalized, true);
    return this.code;
  }
  async join(code) {
    const normalized = roomCode(code);
    await this._start(normalized, false);
    return { id: this.id, code: this.code };
  }
  _start(code, isHost) {
    this.close();
    this.code = code; this.isHost = isHost;
    const generation = this._generation;
    this.onStatus(isHost ? 'Creating room…' : 'Connecting to room…');
    return new Promise((resolve, reject) => {
      let done = false;
      const fail = error => {
        if (done || generation !== this._generation) return;
        done = true; clearTimeout(timer); this._pending = null;
        this.close(); this.onStatus(error.message); reject(error);
      };
      const succeed = () => {
        if (done || generation !== this._generation) return;
        done = true; clearTimeout(timer); this._pending = null; this.connected = true;
        this.onStatus(isHost ? 'Room open' : 'Connected'); resolve();
      };
      const timer = setTimeout(() => fail(new Error('Connection timed out. Check the code and network, then retry.')), TIMEOUT);
      this._pending = fail;
      let peer;
      try {
        const options = peerOptions();
        peer = isHost ? new this.PeerClass(`manta-${this.game}-${code}`, options) : new this.PeerClass(undefined, options);
        this.peer = peer;
      } catch (error) { fail(error); return; }
      peer.on('open', id => {
        if (generation !== this._generation) return;
        this.id = id;
        if (isHost) { succeed(); return; }
        const hostID = `manta-${this.game}-${code}`;
        try {
          const connection = peer.connect(hostID, { reliable: true, serialization: 'json' });
          this._connection = connection;
          this._wire(connection, hostID, false, succeed, fail, generation);
        } catch (error) { fail(friendlyError(error)); }
      });
      peer.on('connection', connection => {
        if (generation !== this._generation || !isHost || this.peers.size >= 7 || this.peers.has(connection.peer)) {
          connection.close(); return;
        }
        this.peers.set(connection.peer, connection);
        this._wire(connection, connection.peer, true, null, null, generation);
      });
      peer.on('error', error => {
        if (generation !== this._generation) return;
        const readable = friendlyError(error);
        if (!done) fail(readable);
        // An unavailable guest must not disconnect everyone else in the room.
        else this.onStatus(readable.message);
      });
      peer.on('disconnected', () => {
        if (generation !== this._generation) return;
        if (!done) fail(new Error('Disconnected from the multiplayer service. Please retry.'));
        else this.onStatus('Signaling disconnected. Existing peer connections remain active.');
      });
      peer.on('close', () => {
        if (generation !== this._generation) return;
        if (!done) fail(new Error('The multiplayer connection closed. Please retry.'));
        else {
          for (const connection of this.peers.values()) connection.close();
          this.peers.clear(); this._connection?.close();
          this.connected = false; this.onStatus('Disconnected');
        }
      });
    });
  }
  _wire(connection, id, inbound, opened, failed, generation) {
    let announced = false; let left = false;
    const openingTimer = inbound ? setTimeout(() => { connection.close(); leave(); }, TIMEOUT) : null;
    connection.on('open', () => {
      if (generation !== this._generation) { connection.close(); return; }
      clearTimeout(openingTimer);
      announced = true;
      if (inbound) this.onPeer(id); else opened?.();
    });
    connection.on('data', value => {
      if (generation !== this._generation || !announced || left) return;
      const data = decode(value);
      if (data) this.onMessage(data, id);
    });
    const leave = () => {
      clearTimeout(openingTimer);
      if (left || generation !== this._generation) return;
      left = true;
      if (inbound) {
        this.peers.delete(id);
        if (announced) this.onLeave(id);
      } else {
        this.connected = false; this._connection = null;
        if (announced) { this.onLeave('host'); this.onStatus('Host disconnected'); }
        else failed?.(new Error('The host closed the connection before joining.'));
      }
    };
    connection.on('close', leave);
    connection.on('error', error => {
      if (!inbound && !announced) failed?.(friendlyError(error));
      leave(); connection.close();
    });
  }
  _send(connection, data) {
    if (!connection?.open || (connection.dataChannel?.bufferedAmount ?? 0) > MAX_BUFFER || (connection.bufferSize ?? 0) > 8) return false;
    const encoded = encode(data);
    if (encoded === null) return false;
    try { connection.send(encoded); return true; } catch { return false; }
  }
  send(data) { return !this.isHost && this.connected ? this._send(this._connection, data) : false; }
  sendTo(id, data) { return this.isHost && this.connected ? this._send(this.peers.get(id), data) : false; }
  broadcast(data) {
    if (!this.isHost || !this.connected) return 0;
    let sent = 0;
    for (const connection of this.peers.values()) if (this._send(connection, data)) sent++;
    return sent;
  }
  close() {
    const pending = this._pending;
    this._pending = null;
    if (pending) { pending(new Error('Connection cancelled.')); return; }
    this._generation++;
    this.connected = false;
    for (const connection of this.peers.values()) connection.close();
    this.peers.clear(); this._connection?.close(); this._connection = null;
    this.peer?.destroy(); this.peer = null; this.id = ''; this.code = ''; this.isHost = false;
  }
}
