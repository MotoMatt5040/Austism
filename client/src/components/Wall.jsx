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

function ListView({ messages, loading, hasMore, loaderRef }) {
  return (
    <>
      <div className="message-list">
        {messages.map((msg) => (
          <div key={msg.id} className="message-card">
            <MessageContent content={msg.content} messageId={msg.message_id} channelId={msg.channel_id} />
            {msg.has_attachment > 0 && (
              <AttachmentLoader messageId={msg.message_id} channelId={msg.channel_id} />
            )}
            <span className="message-date">
              {new Date(msg.rec_date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
        ))}
      </div>
      <div ref={loaderRef} className="scroll-loader">
        {loading && <span>Loading more...</span>}
        {!hasMore && messages.length > 0 && <span>That's all of Austin's wisdom.</span>}
      </div>
    </>
  );
}

function FeedView({ messages, loading, onLoadMore, onDirectionChange }) {
  const containerRef = useRef(null);
  const lastScrollTop = useRef(0);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onScroll() {
      const { scrollTop, clientHeight } = container;
      const idx = Math.round(scrollTop / clientHeight);

      if (scrollTop < lastScrollTop.current) {
        onDirectionChange('up');
      } else if (scrollTop > lastScrollTop.current) {
        onDirectionChange('down');
      }
      lastScrollTop.current = scrollTop;

      setActiveIdx(idx);

      if (idx >= messages.length - 3) {
        onLoadMore();
      }
    }

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [onLoadMore, onDirectionChange, messages.length]);

  // Pause all videos except the active card, play+unmute the active one
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('.feed-card');
    cards.forEach((card, idx) => {
      const videos = card.querySelectorAll('video');
      videos.forEach((v) => {
        if (idx === activeIdx) {
          v.muted = false;
          v.play().catch(() => {});
        } else {
          v.pause();
          v.muted = true;
        }
      });
    });
  }, [activeIdx]);

  return (
    <div className="feed-container" ref={containerRef}>
      {messages.map((msg, idx) => (
        <div key={`${msg.id}-${idx}`} className="feed-card">
          <div className="feed-card-inner">
            <MessageContent content={msg.content} messageId={msg.message_id} channelId={msg.channel_id} autoPlay />
            {msg.has_attachment > 0 && (
              <AttachmentLoader messageId={msg.message_id} channelId={msg.channel_id} />
            )}
          </div>
          <span className="feed-date">
            {new Date(msg.rec_date).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
            })}
          </span>
        </div>
      ))}
      {loading && <div className="feed-card feed-loading">Loading...</div>}
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
  const loadingRef = useRef(false);
  const isFeed = order === 'random';

  const load = useCallback(async (pageNum, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await fetchMessages(pageNum, isFeed ? 5 : 10, order);
      setMessages((prev) => reset ? data.messages : [...prev, ...data.messages]);
      setHasMore(data.messages.length > 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    loadingRef.current = false;
  }, [order, isFeed]);

  useEffect(() => {
    setMessages([]);
    setPage(1);
    setHasMore(true);
    load(1, true);
  }, [order]);

  // List view infinite scroll
  useEffect(() => {
    if (isFeed || !loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
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
  }, [hasMore, isFeed, messages.length]);

  const [headerVisible, setHeaderVisible] = useState(true);

  const handleFeedLoadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    setPage((p) => {
      const next = p + 1;
      load(next);
      return next;
    });
  }, [hasMore, load]);

  const handleDirectionChange = useCallback((dir) => {
    setHeaderVisible(dir === 'up');
  }, []);

  // Lock body scroll and hide page header/footer in feed mode
  useEffect(() => {
    if (isFeed) {
      document.body.style.overflow = 'hidden';
      document.querySelector('.header')?.classList.add('feed-hidden');
      document.querySelector('.footer')?.classList.add('feed-hidden');
    } else {
      document.body.style.overflow = '';
      document.querySelector('.header')?.classList.remove('feed-hidden');
      document.querySelector('.footer')?.classList.remove('feed-hidden');
    }
    return () => {
      document.body.style.overflow = '';
      document.querySelector('.header')?.classList.remove('feed-hidden');
      document.querySelector('.footer')?.classList.remove('feed-hidden');
    };
  }, [isFeed]);

  function changeOrder(newOrder) {
    if (newOrder === order) return;
    setOrder(newOrder);
  }

  return (
    <div className={isFeed ? 'wall feed-mode' : 'wall'}>
      <div className={`wall-controls ${isFeed && !headerVisible ? 'controls-hidden' : ''}`}>
        <h2>Wall of Austin</h2>
        <div className="order-toggle">
          <button className={order === 'desc' ? 'active' : ''} onClick={() => changeOrder('desc')}>Newest</button>
          <button className={order === 'asc' ? 'active' : ''} onClick={() => changeOrder('asc')}>Oldest</button>
          <button className={order === 'random' ? 'active' : ''} onClick={() => changeOrder('random')}>Feed</button>
        </div>
      </div>

      {isFeed ? (
        <FeedView messages={messages} loading={loading} onLoadMore={handleFeedLoadMore} onDirectionChange={handleDirectionChange} />
      ) : (
        <ListView messages={messages} loading={loading} hasMore={hasMore} loaderRef={loaderRef} />
      )}
    </div>
  );
}
