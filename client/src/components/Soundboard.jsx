import { useState, useEffect, useCallback } from 'react';
import { fetchMessages } from '../api/client.js';

export default function Soundboard() {
  const [messages, setMessages] = useState([]);
  const [copied, setCopied] = useState(null);

  const shuffle = useCallback(async () => {
    try {
      const data = await fetchMessages(1, 48, 'random');
      setMessages(data.messages);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { shuffle(); }, [shuffle]);

  function handleClick(msg) {
    const text = msg.content || msg.attachment || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(msg.id);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="soundboard-page">
      <div className="soundboard-header">
        <h2>The Austin Soundboard</h2>
        <button className="shuffle-button" onClick={shuffle}>Shuffle</button>
      </div>
      <div className="soundboard-grid">
        {messages.map((msg) => (
          <button
            key={msg.id}
            className={`sound-button ${copied === msg.id ? 'copied' : ''}`}
            onClick={() => handleClick(msg)}
            title={msg.content || '[attachment]'}
          >
            <span className="sound-text">
              {msg.content
                ? msg.content.length > 80
                  ? msg.content.slice(0, 77) + '...'
                  : msg.content
                : '[attachment]'}
            </span>
            {copied === msg.id && <span className="copied-badge">Copied!</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
