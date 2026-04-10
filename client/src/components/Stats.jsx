import { useState, useEffect } from 'react';
import { fetchOverview, fetchHourly, fetchWords } from '../api/client.js';

function HourlyChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="hourly-chart">
      <h3>When Austin Types</h3>
      <div className="chart-bars">
        {data.map((d) => (
          <div key={d.hour} className="chart-bar-container">
            <div
              className="chart-bar"
              style={{ height: `${(d.count / max) * 100}%` }}
              title={`${d.hour}:00 UTC - ${d.count} messages`}
            />
            <span className="chart-label">{d.hour}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WordCloud({ words }) {
  const max = Math.max(...words.map((w) => w.value), 1);
  const min = Math.min(...words.map((w) => w.value), 1);
  // Shuffle so it doesn't look sorted
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  // Use log scale for better distribution
  const logMax = Math.log(max + 1);
  const logMin = Math.log(min + 1);
  const range = logMax - logMin || 1;

  return (
    <div className="word-cloud">
      <h3>Austin's Vocabulary</h3>
      <div className="cloud-words">
        {shuffled.map((w) => {
          const t = (Math.log(w.value + 1) - logMin) / range;
          return (
            <span
              key={w.text}
              className="cloud-word"
              style={{
                fontSize: `${0.6 + t * 3}rem`,
                opacity: 0.35 + t * 0.65,
                fontWeight: t > 0.6 ? 700 : 400,
              }}
              title={`${w.text}: ${w.value}`}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function Stats() {
  const [overview, setOverview] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [words, setWords] = useState([]);

  useEffect(() => {
    fetchOverview().then(setOverview).catch(console.error);
    fetchHourly().then(setHourly).catch(console.error);
    fetchWords(80).then(setWords).catch(console.error);
  }, []);

  if (!overview) return <div className="loading">Crunching the numbers...</div>;

  const daySpan = overview.firstMessage && overview.lastMessage
    ? Math.max(1, Math.ceil((new Date(overview.lastMessage) - new Date(overview.firstMessage)) / 86400000))
    : 1;
  const perDay = (overview.totalMessages / daySpan).toFixed(1);

  return (
    <div className="stats-page">
      <h2>Austin by the Numbers</h2>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-number">{overview.totalMessages}</span>
          <span className="stat-label">Total Messages</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{perDay}</span>
          <span className="stat-label">Messages / Day</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{overview.longestStreak}</span>
          <span className="stat-label">Day Streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{overview.totalDays}</span>
          <span className="stat-label">Active Days</span>
        </div>
      </div>

      {hourly.length > 0 && <HourlyChart data={hourly} />}
      {words.length > 0 && <WordCloud words={words} />}
    </div>
  );
}
