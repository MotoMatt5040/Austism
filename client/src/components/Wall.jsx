import { useState, useEffect, useCallback } from 'react';
import { fetchMessages } from '../api/client.js';

export default function Wall() {
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [order, setOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMessages(page, 30, order);
      setMessages(data.messages);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [page, order]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="wall">
      <div className="wall-controls">
        <h2>Wall of Austin</h2>
        <div className="order-toggle">
          <button className={order === 'desc' ? 'active' : ''} onClick={() => { setOrder('desc'); setPage(1); }}>
            Newest
          </button>
          <button className={order === 'asc' ? 'active' : ''} onClick={() => { setOrder('asc'); setPage(1); }}>
            Oldest
          </button>
          <button className={order === 'random' ? 'active' : ''} onClick={() => { setOrder('random'); setPage(1); }}>
            Random
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading the wisdom...</div>
      ) : (
        <div className="message-list">
          {messages.map((msg) => (
            <div key={msg.id} className="message-card">
              <p className="message-content">{msg.content || '[attachment]'}</p>
              {msg.attachment && (
                <a href={msg.attachment} target="_blank" rel="noopener noreferrer" className="message-attachment">
                  Attachment
                </a>
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
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
