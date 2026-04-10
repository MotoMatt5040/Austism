import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMessages, fetchAttachments } from '../api/client.js';
import MessageContent from './MessageContent.jsx';

function AttachmentLoader({ messageId, channelId }) {
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (!messageId || !channelId) return;
    fetchAttachments(messageId, channelId)
      .then(setAttachments)
      .catch(() => {});
  }, [messageId, channelId]);

  if (attachments.length === 0) return null;

  return attachments.map((att, i) => (
    <div key={i} className="message-media">
      {att.contentType?.startsWith('image/') ? (
        <img src={att.url} alt={att.name} loading="lazy" />
      ) : att.contentType?.startsWith('video/') ? (
        <video src={att.url} controls preload="metadata" />
      ) : (
        <a href={att.url} target="_blank" rel="noopener noreferrer">{att.name}</a>
      )}
    </div>
  ));
}

function MessageCard({ msg, isFeed }) {
  return (
    <div className={isFeed ? 'feed-snap-card' : 'message-card'}>
      <div className={isFeed ? 'feed-snap-content' : ''}>
        <MessageContent content={msg.content} messageId={msg.message_id} channelId={msg.channel_id} autoPlay={isFeed} />
        {msg.has_attachment > 0 && (
          <AttachmentLoader messageId={msg.message_id} channelId={msg.channel_id} />
        )}
      </div>
      <span className={isFeed ? 'feed-snap-date' : 'message-date'}>
        {new Date(msg.rec_date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </span>
    </div>
  );
}

export default function Wall() {
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [order, setOrder] = useState('desc');
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef(null);
  const isFeed = order === 'random';

  const load = useCallback(async (pageNum, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await fetchMessages(pageNum, isFeed ? 5 : 10, order);
      setMessages((prev) => reset ? data.messages : [...prev, ...data.messages]);
      setHasMore(pageNum < data.totalPages);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [order, loading, isFeed]);

  useEffect(() => {
    setMessages([]);
    setPage(1);
    setHasMore(true);
    load(1, true);
  }, [order]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((p) => {
            const next = p + 1;
            load(next);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  function changeOrder(newOrder) {
    if (newOrder === order) return;
    setOrder(newOrder);
  }

  return (
    <div className={isFeed ? 'wall feed-mode' : 'wall'}>
      <div className="wall-controls">
        <h2>Wall of Austin</h2>
        <div className="order-toggle">
          <button className={order === 'desc' ? 'active' : ''} onClick={() => changeOrder('desc')}>
            Newest
          </button>
          <button className={order === 'asc' ? 'active' : ''} onClick={() => changeOrder('asc')}>
            Oldest
          </button>
          <button className={order === 'random' ? 'active' : ''} onClick={() => changeOrder('random')}>
            Feed
          </button>
        </div>
      </div>

      {isFeed ? (
        <div className="feed-snap-container">
          {messages.map((msg, idx) => (
            <MessageCard key={`${msg.id}-${idx}`} msg={msg} isFeed />
          ))}
          <div ref={loaderRef} className="feed-snap-card feed-snap-loader">
            {loading && <span>Loading...</span>}
          </div>
        </div>
      ) : (
        <>
          <div className="message-list">
            {messages.map((msg) => (
              <MessageCard key={msg.id} msg={msg} isFeed={false} />
            ))}
          </div>
          <div ref={loaderRef} className="scroll-loader">
            {loading && <span>Loading more...</span>}
            {!hasMore && messages.length > 0 && <span>That's all of Austin's wisdom.</span>}
          </div>
        </>
      )}
    </div>
  );
}
