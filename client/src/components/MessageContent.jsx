import { useState, useEffect } from 'react';
import { refreshMessage } from '../api/client.js';

const URL_REGEX = /(?:\|\|)?(https?:\/\/[^\s|]+)(?:\|\|)?/g;
const IMAGE_EXT = /\.(png|jpg|jpeg|gif|webp)/i;
const VIDEO_EXT = /\.(mp4|mov|webm)/i;
const YOUTUBE_REGEX = /https:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/;
const DISCORD_CDN = /(?:cdn|media)\.discordapp\.(com|net)/;

function LazyVideo({ messageId, channelId, fallbackUrl, autoPlay = false }) {
  const [src, setSrc] = useState(null);
  const [showPlayer, setShowPlayer] = useState(autoPlay);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!messageId || !channelId) { setSrc(fallbackUrl); return; }
    refreshMessage(messageId, channelId)
      .then((data) => {
        const videoEmbed = data.embeds?.find((e) => e.type === 'video');
        const videoAttachment = data.attachments?.find((a) => a.contentType?.startsWith('video/'));
        // Extract clean URL from content — strip ALL pipes and grab the URL
        let contentUrl = null;
        if (data.content) {
          const match = data.content.replace(/\|/g, '').match(/https?:\/\/\S+/);
          contentUrl = match ? match[0] : null;
        }
        setSrc(videoEmbed?.url || videoAttachment?.url || contentUrl || fallbackUrl);
      })
      .catch(() => setSrc(fallbackUrl));
  }, [messageId, channelId, fallbackUrl]);

  function proxyUrl(url) {
    if (!url) return null;
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  }

  function handleError() {
    // Try proxying through our server if direct URL fails
    if (src && !src.startsWith('/api/proxy')) {
      setSrc(proxyUrl(src));
    } else {
      setError(true);
    }
  }

  if (error) {
    return <p className="message-content video-unavailable">Video unavailable</p>;
  }

  if ((showPlayer || autoPlay) && src) {
    return <video src={src} controls autoPlay muted loop preload="auto" onError={handleError} />;
  }

  return (
    <div className="video-thumbnail" onClick={() => { if (src) setShowPlayer(true); }}>
      {src ? (
        <video src={src} muted preload="metadata" className="video-poster-vid" onError={handleError} />
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

function YouTubeEmbed({ url }) {
  const match = url.match(YOUTUBE_REGEX);
  if (!match) return <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>;
  return (
    <iframe
      className="youtube-embed"
      src={`https://www.youtube-nocookie.com/embed/${match[1]}`}
      title="YouTube video"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

function GenericEmbed({ messageId, channelId, url }) {
  const [embed, setEmbed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!messageId || !channelId) { setLoading(false); return; }
    refreshMessage(messageId, channelId)
      .then((data) => {
        // Find the best embed to display
        const imageEmbed = data.embeds?.find((e) => e.type === 'image');
        const videoEmbed = data.embeds?.find((e) => e.type === 'video');
        const richEmbed = data.embeds?.[0];
        setEmbed(imageEmbed || videoEmbed || richEmbed || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [messageId, channelId]);

  if (loading) return <span className="video-loading">Loading...</span>;

  // Got an image from the embed
  if (embed?.type === 'image' && embed?.url) {
    return <img src={embed.url} alt="" loading="lazy" />;
  }

  // Got a video from the embed (like Tenor GIFs)
  if (embed?.type === 'video') {
    // Tenor/Giphy GIFs: the thumbnail IS the gif, prefer it
    if (embed.thumbnail) {
      return <img src={embed.thumbnail} alt="" loading="lazy" />;
    }
    if (embed.url) {
      return <video src={embed.url} autoPlay loop muted playsInline preload="auto" />;
    }
  }

  // Rich embed with thumbnail/image — show it as a card
  if (embed?.thumbnail || embed?.title) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="rich-embed">
        {embed.thumbnail && <img src={embed.thumbnail} alt="" className="rich-embed-thumb" />}
        <div className="rich-embed-info">
          {embed.title && <span className="rich-embed-title">{embed.title}</span>}
          {embed.description && <span className="rich-embed-desc">{embed.description}</span>}
        </div>
      </a>
    );
  }

  // No embed data — just show the link
  return <a href={url} target="_blank" rel="noopener noreferrer" className="message-link">{url}</a>;
}

export default function MessageContent({ content, messageId, channelId, autoPlay = false }) {
  if (!content) return null;

  const cleaned = content.replace(/\|\|/g, '');

  const parts = [];
  let lastIndex = 0;
  const mediaItems = [];

  for (const match of cleaned.matchAll(URL_REGEX)) {
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

        // Direct image links (Discord CDN or any URL ending in image ext)
        if (IMAGE_EXT.test(cleanUrl)) {
          return (
            <div key={i} className="message-media">
              <img src={url} alt="" loading="lazy" />
            </div>
          );
        }

        // Direct video links (Discord CDN)
        if (VIDEO_EXT.test(cleanUrl) && DISCORD_CDN.test(url)) {
          return (
            <div key={i} className="message-media">
              <LazyVideo messageId={messageId} channelId={channelId} fallbackUrl={url} autoPlay={autoPlay} />
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

        // Everything else — use Discord embed data to render
        return (
          <div key={i} className="message-media">
            <GenericEmbed messageId={messageId} channelId={channelId} url={url} />
          </div>
        );
      })}
    </>
  );
}
