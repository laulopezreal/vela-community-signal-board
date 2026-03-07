const EventEmitter = require('events');

const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
const INTENTS_GUILD_MESSAGES = 1 << 9;
const INTENTS_MESSAGE_CONTENT = 1 << 15;

function parseAllowlist(raw) {
  return String(raw || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function nowIso() {
  return new Date().toISOString();
}

function toIso(value) {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? new Date(ms).toISOString() : nowIso();
}

function mapMessageCreateToEnvelope(message) {
  if (!message || typeof message !== 'object') throw new Error('invalid_discord_message');

  const eventId = String(message.id || '').trim();
  const channelId = String(message.channel_id || '').trim();
  const guildId = String(message.guild_id || '').trim();
  const content = String(message.content || '').trim();

  if (!eventId) throw new Error('missing_event_id');
  if (!channelId) throw new Error('missing_channel_id');
  if (!guildId) throw new Error('missing_guild_id');
  if (!content) throw new Error('missing_content');

  return {
    provider: 'discord',
    event_type: 'message_create',
    id: eventId,
    threadId: String(message.thread?.id || message.id),
    channel: message.channel?.name || `Discord#${channelId}`,
    channelId,
    guildId,
    author: message.author?.username || message.author?.global_name || 'unknown',
    createdAt: toIso(message.timestamp),
    reactionCount: Array.isArray(message.reactions) ? message.reactions.length : 0,
    content,
    raw: message,
  };
}

function createDiscordConnector(config = {}) {
  const emitter = new EventEmitter();
  const allowlist = new Set(parseAllowlist(config.channelAllowlist));

  const state = {
    enabled: config.enabled !== false,
    tokenPresent: Boolean(config.token),
    connected: false,
    ready: false,
    lastError: null,
    sessionId: null,
    sequence: null,
    heartbeatAck: true,
    heartbeatIntervalMs: null,
    ws: null,
    heartbeatTimer: null,
    reconnectTimer: null,
    reconnectBackoffMs: 1000,
    closing: false,
  };

  function emitGateway(status, detail = {}) {
    emitter.emit('gateway_metric', { status, ...detail });
  }

  function isAllowed(message) {
    const guildId = String(message.guild_id || '').trim();
    const channelId = String(message.channel_id || '').trim();

    if (!guildId) return { ok: false, reason: 'missing_guild_id', guildId, channelId };
    if (String(config.guildId || '').trim() && guildId !== String(config.guildId).trim()) {
      return { ok: false, reason: 'guild_mismatch', guildId, channelId };
    }
    if (allowlist.size && !allowlist.has(channelId)) {
      return { ok: false, reason: 'channel_not_allowlisted', guildId, channelId };
    }
    return { ok: true, guildId, channelId };
  }

  function closeSocket() {
    if (state.ws) {
      try { state.ws.close(); } catch (_) {}
    }
    state.ws = null;
    state.connected = false;
  }

  function clearTimers() {
    if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
    if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
    state.heartbeatTimer = null;
    state.reconnectTimer = null;
  }

  function send(payload) {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    state.ws.send(JSON.stringify(payload));
  }

  function scheduleReconnect() {
    if (state.closing || !state.enabled || !state.tokenPresent) return;
    if (state.reconnectTimer) return;
    const waitMs = Math.min(state.reconnectBackoffMs, 30000);
    state.reconnectBackoffMs = Math.min(waitMs * 2, 30000);
    state.reconnectTimer = setTimeout(() => {
      state.reconnectTimer = null;
      connect();
    }, waitMs);
  }

  function startHeartbeat(intervalMs) {
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) return;
    if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
    state.heartbeatAck = true;
    state.heartbeatTimer = setInterval(() => {
      if (!state.heartbeatAck) {
        state.lastError = 'heartbeat_not_acked';
        emitGateway('dropped', { reason: 'heartbeat_timeout' });
        closeSocket();
        scheduleReconnect();
        return;
      }
      state.heartbeatAck = false;
      send({ op: 1, d: state.sequence });
    }, intervalMs);
  }

  function onGatewayPacket(packet) {
    if (!packet || typeof packet !== 'object') return;
    if (Number.isInteger(packet.s)) state.sequence = packet.s;

    if (packet.op === 10) {
      startHeartbeat(packet.d?.heartbeat_interval);
      send({
        op: 2,
        d: {
          token: config.token,
          intents: INTENTS_GUILD_MESSAGES | INTENTS_MESSAGE_CONTENT,
          properties: { os: process.platform, browser: 'vela-phase1', device: 'vela-phase1' },
        },
      });
      return;
    }

    if (packet.op === 11) {
      state.heartbeatAck = true;
      return;
    }

    if (packet.op === 0 && packet.t === 'READY') {
      state.ready = true;
      state.sessionId = packet.d?.session_id || null;
      state.lastError = null;
      state.reconnectBackoffMs = 1000;
      emitter.emit('ready', {
        mode: 'gateway-live',
        provider: 'discord',
        enabled: state.enabled,
        sessionId: state.sessionId,
      });
      return;
    }

    if (packet.op === 0 && packet.t === 'MESSAGE_CREATE') {
      emitGateway('received', { event: 'MESSAGE_CREATE' });
      const gate = isAllowed(packet.d || {});
      if (!gate.ok) {
        emitGateway('dropped', { event: 'MESSAGE_CREATE', reason: gate.reason, guildId: gate.guildId, channelId: gate.channelId });
        return;
      }

      try {
        const envelope = mapMessageCreateToEnvelope(packet.d);
        emitGateway('accepted', { event: 'MESSAGE_CREATE', guildId: envelope.guildId, channelId: envelope.channelId });
        const traceId = `discord_gateway_${Date.now().toString(36)}_${envelope.id}`;
        emitter.emit('event', { envelope, traceId });
      } catch (err) {
        emitGateway('dropped', { event: 'MESSAGE_CREATE', reason: err.message, guildId: gate.guildId, channelId: gate.channelId });
      }
    }
  }

  function connect() {
    if (!state.enabled || !state.tokenPresent || state.closing) return;
    clearTimers();
    closeSocket();
    state.ready = false;

    const ws = new WebSocket(GATEWAY_URL);
    state.ws = ws;

    ws.addEventListener('open', () => {
      state.connected = true;
      state.lastError = null;
    });

    ws.addEventListener('message', (evt) => {
      try {
        const packet = JSON.parse(String(evt.data || '{}'));
        onGatewayPacket(packet);
      } catch (err) {
        state.lastError = `gateway_packet_parse_error:${err.message}`;
        emitGateway('dropped', { reason: 'gateway_packet_parse_error' });
      }
    });

    ws.addEventListener('error', (err) => {
      state.lastError = err?.message || 'gateway_socket_error';
      emitGateway('dropped', { reason: 'gateway_socket_error' });
    });

    ws.addEventListener('close', () => {
      state.connected = false;
      state.ready = false;
      clearTimers();
      scheduleReconnect();
    });
  }

  return {
    start() {
      state.closing = false;
      if (!state.enabled) {
        emitter.emit('ready', { mode: 'disabled', provider: 'discord', enabled: false });
        return;
      }
      if (!state.tokenPresent) {
        state.lastError = 'missing_bot_token';
        emitter.emit('ready', { mode: 'misconfigured', provider: 'discord', enabled: true, tokenPresent: false });
        return;
      }
      connect();
    },
    stop() {
      state.closing = true;
      clearTimers();
      closeSocket();
      emitter.removeAllListeners();
    },
    on(eventName, handler) { emitter.on(eventName, handler); },
    ingest(rawEvent) {
      const normalized = {
        ...rawEvent,
        guild_id: rawEvent.guild_id || rawEvent.guildId,
        channel_id: rawEvent.channel_id || rawEvent.channelId,
      };
      const gate = isAllowed(normalized);
      if (!gate.ok) throw new Error(gate.reason);
      return mapMessageCreateToEnvelope(normalized);
    },
    isReady() {
      if (!state.enabled) return true;
      return state.ready;
    },
    config: {
      enabled: state.enabled,
      guildId: config.guildId,
      channelAllowlist: [...allowlist],
      tokenPresent: state.tokenPresent,
    },
    status() {
      return {
        enabled: state.enabled,
        tokenPresent: state.tokenPresent,
        connected: state.connected,
        ready: state.ready,
        sessionId: state.sessionId,
        lastError: state.lastError,
      };
    },
  };
}

module.exports = { createDiscordConnector };
