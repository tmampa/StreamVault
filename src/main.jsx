import { createRoot } from 'react-dom/client'
import { WatchlistProvider } from './context/WatchlistContext'
import { ContinueWatchingProvider } from './context/ContinueWatchingContext'
import { GenreProvider } from './context/GenreContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <GenreProvider>
    <WatchlistProvider>
      <ContinueWatchingProvider>
        <App />
      </ContinueWatchingProvider>
    </WatchlistProvider>
  </GenreProvider>,
)
