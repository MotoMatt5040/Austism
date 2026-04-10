const CDN_REGEX = /(?:\|\|)?(https:\/\/(?:cdn|media)\.discordapp\.(?:com|net)\/attachments\/[^\s|]+)(?:\|\|)?/g;
const IMAGE_EXT = /\.(png|jpg|jpeg|gif|webp)/i;
const VIDEO_EXT = /\.(mp4|mov|webm)/i;

export default function MessageContent({ content }) {
  if (!content) return null;

  // Strip spoiler tags
  const cleaned = content.replace(/\|\|/g, '');

  // Split content into text and media URLs
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

  // If no URLs found, just render as text
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
              <video src={url} controls preload="metadata" />
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
