import { useState, useEffect, useRef } from 'react';
import { fetchOverview, fetchHourly, fetchWords } from '../api/client.js';
import { pack, hierarchy } from 'd3-hierarchy';

function HourlyChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  const [hovered, setHovered] = useState(null);

  return (
    <div className="hourly-chart">
      <h3>When Austin Types</h3>
      <div className="chart-tooltip-wrapper">
        {hovered !== null && (
          <div className="chart-tooltip">
            {hovered.hour}:00 UTC — {((hovered.count / total) * 100).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="chart-bars">
        {data.map((d) => (
          <div
            key={d.hour}
            className={`chart-bar-container ${hovered?.hour === d.hour ? 'chart-bar-active' : ''}`}
            onMouseEnter={() => setHovered(d)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="chart-bar"
              style={{ height: `${(d.count / max) * 100}%` }}
            />
            <span className="chart-label">{d.hour}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WordBubbles({ words }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState(500);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    setSize(Math.min(w, 600));
    const onResize = () => setSize(Math.min(containerRef.current.clientWidth, 600));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (words.length === 0) return null;

  const root = hierarchy({ children: words })
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  const packed = pack()
    .size([size, size])
    .padding(3)(root);

  const leaves = packed.leaves();

  return (
    <div className="word-cloud" ref={containerRef}>
      <h3>Austin's Vocabulary</h3>
      <div className="bubble-tooltip-wrapper">
        {hovered && (
          <span className="bubble-tooltip">{hovered.data.text}: {hovered.data.value}</span>
        )}
      </div>
      <svg width={size} height={size} className="bubble-svg">
        {leaves.map((leaf) => (
          <g
            key={leaf.data.text}
            transform={`translate(${leaf.x},${leaf.y})`}
            onMouseEnter={() => setHovered(leaf)}
            onMouseLeave={() => setHovered(null)}
            className={`bubble-group ${hovered && hovered.data.text !== leaf.data.text ? 'bubble-dimmed' : ''}`}
          >
            <circle
              r={leaf.r}
              className="bubble-circle"
            />
            {leaf.r > 18 && (
              <text
                className="bubble-label"
                textAnchor="middle"
                dy="0.35em"
                fontSize={Math.min(leaf.r * 0.45, 14)}
              >
                {leaf.data.text}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

const RANGE_OPTIONS = [
  { value: '', label: 'All Time' },
  { value: '1y', label: '1 Year' },
  { value: '6m', label: '6 Months' },
  { value: '3m', label: '3 Months' },
  { value: '1m', label: '1 Month' },
  { value: '1w', label: '1 Week' },
];

export default function Stats() {
  const [overview, setOverview] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [words, setWords] = useState([]);
  const [range, setRange] = useState('');

  useEffect(() => {
    fetchOverview().then(setOverview).catch(console.error);
  }, []);

  useEffect(() => {
    fetchHourly(range).then(setHourly).catch(console.error);
    fetchWords(80, range).then(setWords).catch(console.error);
  }, [range]);

  if (!overview) return <div className="loading">Crunching the numbers...</div>;

  const daySpan = overview.firstMessage && overview.lastMessage
    ? Math.max(1, Math.ceil((new Date(overview.lastMessage) - new Date(overview.firstMessage)) / 86400000))
    : 1;
  const perDay = (overview.totalMessages / daySpan).toFixed(1);

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h2>Austin by the Numbers</h2>
        <select
          className="range-select"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

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
      {words.length > 0 && <WordBubbles words={words} />}
    </div>
  );
}
