import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchMessageCount } from '../api/client.js';

export default function Layout() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    fetchMessageCount().then((d) => setCount(d.count)).catch(() => {});
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">The Austin Archive</h1>
        <p className="tagline">every word preserved for posterity (and roasting)</p>
        <nav className="nav">
          <NavLink to="/" end>Wall</NavLink>
          <NavLink to="/quote">Quote</NavLink>
          <NavLink to="/stats">Stats</NavLink>
          <NavLink to="/soundboard">Soundboard</NavLink>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        {count !== null && <span>{count} messages archived and counting</span>}
      </footer>
    </div>
  );
}
