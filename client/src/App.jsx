import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Wall from './components/Wall.jsx';
import QuoteGenerator from './components/QuoteGenerator.jsx';
import Stats from './components/Stats.jsx';
import Soundboard from './components/Soundboard.jsx';
import Feed from './components/Feed.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Wall />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/quote" element={<QuoteGenerator />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/soundboard" element={<Soundboard />} />
      </Route>
    </Routes>
  );
}
