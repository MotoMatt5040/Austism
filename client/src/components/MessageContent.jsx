import { useState, useEffect } from 'react';
import { refreshMessage } from '../api/client.js';

const CDN_REGEX = /(?:\|\|)?(https:\/\/(?:cdn|media)\.discordapp\.(?:com|net)\/[^\s|]+)(?:\|\|)?/g;
const EMBED_URL_REGEX = /https:\/\/(?:tenor\.com|giphy\.com|gfycat\.com)\/\S+/;
const YOUTUBE_REGEX = /https:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/;
const IMAGE_EXT = /\.(png|jpg|jpeg|gif|webp)/i;
const VIDEO_EXT = /\.(mp4|mov|webm)/i;
const ALL_MEDIA_REGEX = /(?:\|\|)?(https:\/\/(?:(?:cdn|media)\.discordapp\.(?:com|net)|tenor\.com|giphy\.com|gfycat\.com|(?:www\.)?youtube\.com|youtu\.be)\/[^\s|]+)(?:\|\|)?/g;

function LazyVideo({ messageId, channelId, fallbackUrl }) {
  const [src, setSrc] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!messageId || !channelId) { setSrc(fallbackUrl); return; }
    refreshMessage(messageId, channelId)
      .then((data) => {
        const videoEmbed = data.embeds?.find((e) => e.type === 'video');
        const videoAttachment = data.attachments?.find((a) => a.contentType?.startsWith('video/'));
        setSrc(videoEmbed?.url || videoAttachment?.url || data.content?.replace(/\|\|/g, '') || fallbackUrl);
      })
      .catch(() => setSrc(fallbackUrl));
  }, [messageId, channelId, fallbackUrl]);

  if (error) {
    return <p className="message-content video-unavailable">Video unavailable</p>;
  }

  if (showPlayer && src) {
    return <video src={src} controls autoPlay preload="auto" onError={() => setError(true)} />;
  }

  return (
    <div className="video-thumbnail" onClick={() => { if (src) setShowPlayer(true); }}>
      {src ? (
        <video src={src} muted preload="metadata" className="video-poster-vid" onError={() => setError(true)} />
      ) : (
        <div className="video-poster-placeholder" />
      )}
      <div className="video-play-overlay">
        {!src ? (
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

function EmbedMedia({ messageId, channelId, url }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!messageId || !channelId) return;
    refreshMessage(messageId, channelId)
      .then((data) => {
        const imageEmbed = data.embeds?.find((e) => e.type === 'image');
        const videoEmbed = data.embeds?.find((e) => e.type === 'video');
        setSrc(imageEmbed?.url || videoEmbed?.url || null);
      })
      .catch(() => setError(true));
  }, [messageId, channelId]);

  if (error || (!src && !url)) return null;

  if (src) {
    // Check if it's a gif/image or video
    if (VIDEO_EXT.test(src.split('?')[0])) {
      return <video src={src} autoPlay loop muted playsInline preload="auto" />;
    }
    return <img src={src} alt="" loading="lazy" />;
  }

  return <span className="video-loading">Loading GIF...</span>;
}

function YouTubeEmbed({ url }) {
  const match = url.match(YOUTUBE_REGEX);
  if (!match) return <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>;
  const videoId = match[1];
  return (
    <iframe
      className="youtube-embed"
      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
      title="YouTube video"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

export default function MessageContent({ content, messageId, channelId, thumbnail }) {
  if (!content) return null;

  const cleaned = content.replace(/\|\|/g, '');

  const parts = [];
  let lastIndex = 0;
  const mediaItems = [];

  for (const match of cleaned.matchAll(ALL_MEDIA_REGEX)) {
    const url = (match[1] || match[0]).replace(/\|\|/g, '');
    const before = cleaned.slice(lastIndex, match.index);
    if (before.trim()) parts.push({ type: 'text', value: before.trim() });
    mediaItems.push(url);
    lastIndex = match.index + match[0].length;
  }

  const after = cleaned.slice(lastIndex);
  if (after.trim()) parts.push({ type: 'text', value: after.trim() });

  if (mediaItems.length === 0) {
    return <p className="message-content">{cleaned}</p>;
  }

  return (
    <>
      {parts.map((p, i) => (
        <p key={i} className="message-content">{p.value}</p>
      ))}
      {mediaItems.map((url, i) => {
        const cleanUrl = url.split('?')[0];

        // Discord CDN images
        if (IMAGE_EXT.test(cleanUrl)) {
          return (
            <div key={i} className="message-media">
              <img src={url} alt="" loading="lazy" />
            </div>
          );
        }

        // Discord CDN videos
        if (VIDEO_EXT.test(cleanUrl)) {
          return (
            <div key={i} className="message-media">
              <LazyVideo messageId={messageId} channelId={channelId} fallbackUrl={url} />
            </div>
          );
        }

        // YouTube
        if (YOUTUBE_REGEX.test(url)) {
          return (
            <div key={i} className="message-media">
              <YouTubeEmbed url={url} />
            </div>
          );
        }

        // Tenor/Giphy/Gfycat — fetch the actual GIF from Discord embed
        if (EMBED_URL_REGEX.test(url)) {
          return (
            <div key={i} className="message-media">
              <EmbedMedia messageId={messageId} channelId={channelId} url={url} />
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
