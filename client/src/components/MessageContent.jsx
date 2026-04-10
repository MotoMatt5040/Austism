import { useState } from 'react';
import { refreshMessage } from '../api/client.js';

const CDN_REGEX = /(?:\|\|)?(https:\/\/(?:cdn|media)\.discordapp\.(?:com|net)\/attachments\/[^\s|]+)(?:\|\|)?/g;
const IMAGE_EXT = /\.(png|jpg|jpeg|gif|webp)/i;
const VIDEO_EXT = /\.(mp4|mov|webm)/i;

function LazyVideo({ messageId, channelId, fallbackUrl }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (src || loading) return;
    setLoading(true);
    try {
      const data = await refreshMessage(messageId, channelId);
      const videoEmbed = data.embeds?.find((e) => e.type === 'video');
      const videoAttachment = data.attachments?.find((a) => a.contentType?.startsWith('video/'));
      setSrc(videoEmbed?.url || videoAttachment?.url || data.content?.replace(/\|\|/g, '') || fallbackUrl);
    } catch {
      setSrc(fallbackUrl);
    }
    setLoading(false);
  }

  if (!src) {
    return (
      <div className="video-thumbnail" onClick={load}>
        <div className="video-play-overlay">
          {loading ? (
            <span className="video-loading">Loading...</span>
          ) : (
            <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
      </div>
    );
  }

  return <video src={src} controls autoPlay preload="auto" />;
}

export default function MessageContent({ content, messageId, channelId }) {
  if (!content) return null;

  const cleaned = content.replace(/\|\|/g, '');

  const parts = [];
  let lastIndex = 0;
  const urls = [];

  for (const match of cleaned.matchAll(CDN_REGEX)) {
    const url = match[1] || match[0];
    const before = cleaned.slice(lastIndex, match.index);
    if (before.trim()) parts.push({ type: 'text', value: before.trim() });
    urls.push(url.replace(/\|\|/g, ''));
    lastIndex = match.index + match[0].length;
  }

  const after = cleaned.slice(lastIndex);
  if (after.trim()) parts.push({ type: 'text', value: after.trim() });

  if (urls.length === 0) {
    return <p className="message-content">{cleaned}</p>;
  }

  return (
    <>
      {parts.map((p, i) => (
        <p key={i} className="message-content">{p.value}</p>
      ))}
      {urls.map((url, i) => {
        const cleanUrl = url.split('?')[0];
        if (IMAGE_EXT.test(cleanUrl)) {
          return (
            <div key={i} className="message-media">
              <img src={url} alt="" loading="lazy" />
            </div>
          );
        }
        if (VIDEO_EXT.test(cleanUrl)) {
          return (
            <div key={i} className="message-media">
              <LazyVideo messageId={messageId} channelId={channelId} fallbackUrl={url} />
            </div>
          );
        }
        return (
          <div key={i} className="message-media">
            <a href={url} target="_blank" rel="noopener noreferrer">Attachment</a>
          </div>
        );
      })}
    </>
  );
}
