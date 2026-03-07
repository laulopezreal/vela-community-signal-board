import { OWNER_MAP, clamp, cleanText, fingerprint, hash, scoreRubric, findPrimaryDimension } from './rubric.js';

function toIsoSafe(v) {
  const t = new Date(v).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

function normalizeMessage(msg, connector) {
  const id = cleanText(msg.id || msg.messageId || msg.emailId || '');
  const content = cleanText(msg.content || msg.body || msg.subject || msg.text || '');
  const createdAt = toIsoSafe(msg.createdAt || msg.timestamp || msg.sentAt);
  const source = cleanText(msg._sourceChannel || msg.channel || msg.mailbox || `${connector}#unknown`);
  const threadId = cleanText(msg.threadId || msg.parentId || msg.conversationId || id || '');

  if (!id || !content || !createdAt) return { skip: true, reason: 'missing_required_fields' };

  const title = content.length > 120 ? `${content.slice(0, 117)}...` : content;
  const reactions = clamp(msg.reactionCount || msg.reactions || msg.replyCount || 0, 0, 999, 0);
  const rubric = scoreRubric(title, content, reactions);
  const primary = findPrimaryDimension(rubric);

  return {
    skip: false,
    signal: {
      signalId: `sig_${hash(`${connector}:${id}`).slice(0, 12)}`,
      connector,
      externalId: `${connector}:${id}`,
      threadId: threadId || `thread:${id}`,
      source,
      title,
      content,
      createdAt,
      ownerHint: OWNER_MAP[primary],
      primaryDimension: primary,
      ...rubric,
      dedupeKey: fingerprint(title),
      idempotencyKey: hash(`${connector}|${id}|${createdAt}|${content}`),
    },
  };
}

function parseExport(payload, connector) {
  const rows = [];
  if (connector === 'discord') {
    for (const c of payload?.channels || []) {
      const channelName = c?.name ? `Discord #${c.name}` : 'Discord #unknown';
      for (const m of c?.messages || []) rows.push({ ...m, _sourceChannel: channelName });
    }
    return rows;
  }

  if (connector === 'slack') {
    for (const c of payload?.channels || []) {
      const channelName = c?.name ? `Slack #${c.name}` : 'Slack #unknown';
      for (const m of c?.messages || []) rows.push({ ...m, _sourceChannel: channelName, id: m.ts || m.id });
    }
    return rows;
  }

  if (connector === 'email') {
    for (const m of payload?.emails || []) rows.push({ ...m, id: m.id || m.messageId, _sourceChannel: m.mailbox || 'Email inbox' });
    return rows;
  }

  return rows;
}

function clusterDedupe(signals) {
  const clusters = new Map();
  for (const s of signals) {
    const key = s.dedupeKey || s.signalId;
    if (!clusters.has(key)) {
      clusters.set(key, {
        clusterId: `cl_${hash(key).slice(0, 10)}`,
        dedupeKey: key,
        canonicalSignalId: s.signalId,
        members: [],
        weighted: s.weighted,
      });
    }
    const c = clusters.get(key);
    c.members.push(s.signalId);
    if (s.weighted > c.weighted) {
      c.weighted = s.weighted;
      c.canonicalSignalId = s.signalId;
    }
  }
  return [...clusters.values()].sort((a, b) => b.weighted - a.weighted || b.members.length - a.members.length);
}

export { toIsoSafe, normalizeMessage, parseExport, clusterDedupe };
