import { useState, useEffect } from 'react';
import { fetchRandomMessage } from '../api/client.js';

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
            <blockquote className="quote-text">
              "{quote.content || '[attachment only]'}"
            </blockquote>
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
