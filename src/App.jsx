import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MovieDetailPage from './pages/MovieDetailPage';
import TvDetailPage from './pages/TvDetailPage';
import WatchPage from './pages/WatchPage';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand">StreamVault</div>
      <p className="footer__text">
        Powered by TMDB & VidKing · Built with ❤️
      </p>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/tv/:id" element={<TvDetailPage />} />
        <Route path="/watch/movie/:id" element={<WatchPage />} />
        <Route path="/watch/tv/:id/:season/:episode" element={<WatchPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
