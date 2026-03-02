const EventEmitter = require('events');

function parseAllowlist(raw) {
  return String(raw || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function createDiscordConnector(config = {}) {
  const emitter = new EventEmitter();
  const allowlist = new Set(parseAllowlist(config.channelAllowlist));

  function isAllowed(channelId) {
    if (!allowlist.size) return true;
    return allowlist.has(String(channelId || '').trim());
  }

  function toGatewayEnvelope(rawEvent) {
    if (!rawEvent || typeof rawEvent !== 'object') throw new Error('invalid_discord_event');

    const eventId = String(rawEvent.id || rawEvent.event_id || '').trim();
    const channelId = String(rawEvent.channelId || rawEvent.channel_id || '').trim();
    const createdAt = rawEvent.createdAt || rawEvent.timestamp || new Date().toISOString();
    const content = String(rawEvent.content || rawEvent.message || '').trim();

    if (!eventId) throw new Error('missing_event_id');
    if (!channelId) throw new Error('missing_channel_id');
    if (!content) throw new Error('missing_content');
    if (!isAllowed(channelId)) throw new Error(`channel_not_allowlisted:${channelId}`);

    return {
      provider: 'discord',
      event_type: String(rawEvent.eventType || rawEvent.event_type || 'message_create'),
      id: eventId,
      threadId: String(rawEvent.threadId || rawEvent.thread_id || eventId),
      channel: rawEvent.channel || `Discord#${channelId}`,
      channelId,
      author: rawEvent.author || rawEvent.username || 'unknown',
      createdAt: new Date(createdAt).toISOString(),
      reactionCount: Number(rawEvent.reactionCount || rawEvent.reactions || 0),
      content,
      raw: rawEvent,
    };
  }

  return {
    start() {
      emitter.emit('ready', { mode: 'gateway-adapter', provider: 'discord', enabled: config.enabled !== false });
    },
    stop() { emitter.removeAllListeners(); },
    on(eventName, handler) { emitter.on(eventName, handler); },
    ingest(rawEvent) {
      const envelope = toGatewayEnvelope(rawEvent);
      emitter.emit('event', envelope);
      return envelope;
    },
    config: {
      enabled: config.enabled !== false,
      guildId: config.guildId,
      channelAllowlist: [...allowlist],
      tokenPresent: Boolean(config.token),
    },
  };
}

module.exports = { createDiscordConnector };
