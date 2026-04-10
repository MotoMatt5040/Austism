import { useState, useEffect } from 'react';
import { fetchRandomMessage } from '../api/client.js';
import MessageContent from './MessageContent.jsx';

export default function QuoteGenerator() {
  const [quote, setQuote] = useState(null);
  const [fading, setFading] = useState(false);

  async function getQuote() {
    setFading(true);
    try {
      const msg = await fetchRandomMessage();
      setTimeout(() => {
        setQuote(msg);
        setFading(false);
      }, 300);
    } catch (e) {
      console.error(e);
      setFading(false);
    }
  }

  useEffect(() => { getQuote(); }, []);

  return (
    <div className="quote-page">
      <div className={`quote-display ${fading ? 'fade-out' : 'fade-in'}`}>
        {quote && (
          <>
            <div className="quote-media-wrap">
              <MessageContent content={quote.content} messageId={quote.message_id} channelId={quote.channel_id} />
            </div>
            {quote.attachments?.map((att, i) => (
              <div key={i} className="quote-media">
                {att.contentType?.startsWith('image/') ? (
                  <img src={att.url} alt={att.name} />
                ) : att.contentType?.startsWith('video/') ? (
                  <video src={att.url} controls preload="metadata" />
                ) : null}
              </div>
            ))}
            <cite className="quote-attribution">
              &mdash; Austin, {new Date(quote.rec_date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </cite>
          </>
        )}
      </div>
      <button className="quote-button" onClick={getQuote}>
        Another One
      </button>
    </div>
  );
}
