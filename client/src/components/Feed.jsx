import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchMessages } from '../api/client.js';
import MessageContent from './MessageContent.jsx';

export default function Feed() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await fetchMessages(1, 5, 'random');
      setCards((prev) => [...prev, ...data.messages]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [loading]);

  useEffect(() => { loadMore(); }, []);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading]);

  return (
    <div className="feed">
      <h2 className="feed-title">The Austin Feed</h2>
      <p className="feed-subtitle">scroll for random austin moments</p>

      <div className="feed-cards">
        {cards.filter((msg) => msg.content || msg.has_attachment).map((msg, idx) => (
          <div key={`${msg.id}-${idx}`} className="feed-card">
            <div className="feed-card-content">
              <MessageContent
                content={msg.content}
                messageId={msg.message_id}
                channelId={msg.channel_id}
                thumbnail={msg.thumbnail}
              />
            </div>
            <span className="feed-card-date">
              {new Date(msg.rec_date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </span>
          </div>
        ))}
      </div>

      <div ref={loaderRef} className="scroll-loader">
        {loading && <span>Loading more...</span>}
      </div>
    </div>
  );
}
