import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'));
const TvDetailPage = lazy(() => import('./pages/TvDetailPage'));
const WatchPage = lazy(() => import('./pages/WatchPage'));
const GenrePage = lazy(() => import('./pages/GenrePage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoading() {
  return (
    <div className="loading-container" style={{ marginTop: 'var(--nav-height)' }}>
      <div className="spinner" />
      <span className="loading-text">Loading...</span>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand">StreamVault</div>
      <p className="footer__text">
        Powered by TMDB & VidKing · Third-party playback may be subject to separate terms.
      </p>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <ErrorBoundary>
        <main id="main-content">
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/movie/:id" element={<MovieDetailPage />} />
              <Route path="/tv/:id" element={<TvDetailPage />} />
              <Route path="/watch/movie/:id" element={<WatchPage />} />
              <Route path="/watch/tv/:id/:season/:episode" element={<WatchPage />} />
              <Route path="/genre/:id" element={<GenrePage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
      </ErrorBoundary>
      <Footer />
    </BrowserRouter>
  );
}
