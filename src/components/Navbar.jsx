import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Play } from 'lucide-react';
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

  // Close mobile menu on navigation
  useEffect(() => {
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
          <span className="navbar__logo-icon"><Play size={18} fill="currentColor" /></span>
          Stephinah
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
