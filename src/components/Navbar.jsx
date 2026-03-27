import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { watchlist } = useWatchlist();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when the route changes (e.g. back/forward)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync menu to URL; alternatives add more complexity
    setMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMenuOpen(false);
    }
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (!searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="10" r="2.5" fill="currentColor" />
              <circle cx="15" cy="10" r="2.5" fill="currentColor" />
              <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
              <path d="M6 4c-1-1-2.5-.5-2.5 1C3.5 7 5 9 7 10" />
              <path d="M18 4c1-1 2.5-.5 2.5 1C20.5 7 19 9 17 10" />
              <path d="M12 17v3" />
            </svg>
          </span>
          Owl
        </Link>

        <ul className={`navbar__links ${menuOpen ? 'open' : ''}`}>
          <li>
            <Link to="/" className={`navbar__link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/search?type=movie" className={`navbar__link ${location.pathname === '/search' && location.search.includes('type=movie') ? 'active' : ''}`}>
              Movies
            </Link>
          </li>
          <li>
            <Link to="/search?type=tv" className={`navbar__link ${location.pathname === '/search' && location.search.includes('type=tv') ? 'active' : ''}`}>
              TV Shows
            </Link>
          </li>
          <li>
            <Link to="/watchlist" className={`navbar__link ${isActive('/watchlist') ? 'active' : ''}`}>
              Watchlist{watchlist.length > 0 ? ` (${watchlist.length})` : ''}
            </Link>
          </li>
        </ul>

        <div className="navbar__search">
          <form onSubmit={handleSearch}>
            <button type="button" className="navbar__search-btn" onClick={toggleSearch}>
              <Search size={18} />
            </button>
            <input
              ref={searchRef}
              type="text"
              className={`navbar__search-input ${searchOpen ? 'expanded' : ''}`}
              placeholder="Search movies & shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => !searchQuery && setSearchOpen(false)}
            />
          </form>
        </div>

        <button
          className={`navbar__mobile-btn ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
