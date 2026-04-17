import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext'
import { WatchlistProvider } from './context/WatchlistContext'
import { ContinueWatchingProvider } from './context/ContinueWatchingContext'
import { GenreProvider } from './context/GenreContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <AuthProvider>
      <GenreProvider>
        <WatchlistProvider>
          <ContinueWatchingProvider>
            <App />
          </ContinueWatchingProvider>
        </WatchlistProvider>
      </GenreProvider>
    </AuthProvider>
  </HelmetProvider>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
