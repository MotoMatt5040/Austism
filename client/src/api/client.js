const BASE = '/api';

async function fetchJSON(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function fetchMessages(page = 1, pageSize = 50, order = 'desc') {
  return fetchJSON(`/messages?page=${page}&pageSize=${pageSize}&order=${order}`);
}

export function fetchRandomMessage() {
  return fetchJSON('/messages/random');
}

export function fetchMessageCount() {
  return fetchJSON('/messages/count');
}

export function fetchOverview() {
  return fetchJSON('/stats/overview');
}

export function fetchHourly() {
  return fetchJSON('/stats/hourly');
}

export function fetchWords(limit = 100) {
  return fetchJSON(`/stats/words?limit=${limit}`);
}

export function fetchAttachments(messageId, channelId) {
  return fetchJSON(`/messages/${messageId}/attachments?channelId=${channelId}`);
}

export function refreshMessage(messageId, channelId) {
  return fetchJSON(`/messages/${messageId}/refresh?channelId=${channelId}`);
}

export function fetchThumbnail(messageId, channelId) {
  return fetchJSON(`/messages/${messageId}/thumbnail?channelId=${channelId}`);
}
