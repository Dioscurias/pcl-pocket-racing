import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { RoomConnection } from '../src/network.js';

const registry = new Map();
let serial = 0;
class Channel extends EventEmitter {
  constructor(peer) { super(); this.peer = peer; this.open = false; this.dataChannel = { bufferedAmount: 0 }; }
  send(data) { queueMicrotask(() => this.partner.emit('data', data)); }
  close() {
    if (this.closed) return;
    this.closed = true; this.open = false; this.emit('close');
    if (this.partner && !this.partner.closed) this.partner.close();
  }
}
class FakePeer extends EventEmitter {
  constructor(id, options) {
    super(); this.id = typeof id === 'string' ? id : `guest-${++serial}`; this.options = options;
    queueMicrotask(() => {
      if (registry.has(this.id)) return this.emit('error', { type: 'unavailable-id' });
      registry.set(this.id, this); this.emit('open', this.id);
    });
  }
  connect(id) {
    const local = new Channel(id); this.channel = local;
    queueMicrotask(() => {
      const target = registry.get(id);
      if (!target) return this.emit('error', { type: 'peer-unavailable' });
      const remote = new Channel(this.id); local.partner = remote; remote.partner = local;
      target.emit('connection', remote);
      local.open = remote.open = true; remote.emit('open'); local.emit('open');
    });
    return local;
  }
  destroy() { if (registry.get(this.id) === this) registry.delete(this.id); this.channel?.close(); this.emit('close'); }
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const make = options => new RoomConnection({ PeerClass: FakePeer, ...options });

test('private rooms exchange host-directed and broadcast messages and clean up disconnects', async () => {
  const received = [], joined = [], left = [], client = [];
  const host = make({ onPeer: id => joined.push(id), onMessage: (data, id) => received.push([data, id]), onLeave: id => left.push(id) });
  const guest = make({ onMessage: (data, id) => client.push([data, id]) });
  assert.equal(await host.host('abc234'), 'ABC234');
  assert.equal(host.connected, true);
  const identity = await guest.join(' abc234 ');
  assert.equal(identity.code, 'ABC234');
  assert.equal(joined[0], guest.id);
  guest.send({ type: 'join', name: 'Ray' });
  host.broadcast({ type: 'state', players: [{ id: guest.id }] });
  await tick();
  assert.deepEqual(received[0], [{ type: 'join', name: 'Ray' }, guest.id]);
  assert.equal(client[0][0].type, 'state');
  assert.equal(client[0][1], host.id);
  guest.close(); await tick();
  assert.deepEqual(left, [identity.id]); assert.equal(host.peers.size, 0);
  host.close();
});

test('room validation, game namespaces and occupied host IDs isolate lobbies', async () => {
  const a = make(); const other = make({ game: 'kart' }); const duplicate = make();
  for (const code of ['ABC', 'ABC123!', 'OOOOOO', 'ABC 23']) await assert.rejects(a.join(code), /code/i);
  await a.host('XYZ789'); await other.host('XYZ789');
  assert.notEqual(a.id, other.id);
  await assert.rejects(duplicate.host('XYZ789'), /already in use/i);
  assert.equal(duplicate.connected, false);
  a.close(); other.close(); duplicate.close();
});

test('malformed and oversized messages are dropped and backpressure drops snapshots', async () => {
  const messages = []; const host = make({ onMessage: data => messages.push(data) }); const guest = make();
  await host.host('DEF567'); await guest.join('DEF567');
  const channel = host.peers.get(guest.id);
  channel.emit('data', '{bad'); channel.emit('data', '{"__proto__":{"admin":true}}');
  channel.emit('data', JSON.stringify({ blob: 'x'.repeat(70000) })); channel.emit('data', '123');
  assert.equal(messages.length, 0);
  assert.equal(guest.send({ bad: undefined }), false);
  channel.dataChannel.bufferedAmount = 200000;
  assert.equal(host.sendTo(guest.id, { type: 'state' }), false);
  channel.emit('data', JSON.stringify({ type: 'input', throttle: 1 }));
  assert.equal(messages.length, 1);
  guest.close(); host.close();
});

test('host loss is reported to a guest and clears connection state', async () => {
  const left = []; const host = make(); const guest = make({ onLeave: id => left.push(id) });
  await host.host('GHJ678'); await guest.join('GHJ678');
  host.close(); await tick();
  assert.deepEqual(left, ['host']); assert.equal(guest.connected, false);
  guest.close();
});

test('hosts cap a room at eight players and guests reject unsolicited inbound connections', async () => {
  const host = make(); await host.host('KMP789');
  const guests = [];
  for (let i = 0; i < 7; i++) { const guest = make(); await guest.join('KMP789'); guests.push(guest); }
  assert.equal(host.peers.size, 7);
  const overflow = make(); await assert.rejects(overflow.join('KMP789'), /closed/i);
  const rogue = new Channel('unknown'); guests[0].peer.emit('connection', rogue);
  assert.equal(rogue.closed, true);
  assert.equal(guests[0].connected, true);
  overflow.close(); guests.forEach(guest => guest.close()); host.close();
});

test('cancelling an in-flight connection rejects its promise and prevents stale callbacks', async () => {
  class DelayedPeer extends EventEmitter { destroy() { this.emit('close'); } }
  const transport = new RoomConnection({ PeerClass: DelayedPeer });
  const opening = transport.host('MNP234');
  transport.close();
  await assert.rejects(opening, /cancelled/);
  assert.equal(transport.connected, false); assert.equal(transport.peer, null);
});
