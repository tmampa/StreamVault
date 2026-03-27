import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';

const RECENT_SEARCHES_KEY = 'owl_recent_searches';
const MAX_RECENT = 8;

function loadRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query) {
  const recent = loadRecentSearches().filter((q) => q !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

export function getRecentSearches() {
  return loadRecentSearches();
}

export { saveRecentSearch };

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);
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

  // Sync search input with URL query param when on search page
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      const q = params.get('q') || '';
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync input to URL
      setSearchQuery(q);
      if (q) setSearchOpen(true);
    }
  }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        searchRef.current &&
        !searchRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = useCallback(
    (q) => {
      if (q.trim()) {
        saveRecentSearch(q.trim());
        navigate(`/search?q=${encodeURIComponent(q.trim())}`);
        setShowDropdown(false);
      }
    },
    [navigate]
  );

  // Live debounced search — navigates as the user types
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim()) {
      debounceRef.current = setTimeout(() => {
        navigate(`/search?q=${encodeURIComponent(val.trim())}`, { replace: true });
      }, 400);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    if (searchQuery.trim()) {
      performSearch(searchQuery);
      setMenuOpen(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    clearTimeout(debounceRef.current);
    searchRef.current?.focus();
  };

  const handleRecentClick = (q) => {
    setSearchQuery(q);
    performSearch(q);
  };

  const handleClearRecent = (e) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
  };

  const toggleSearch = () => {
    const opening = !searchOpen;
    setSearchOpen(opening);
    if (opening) {
      setRecentSearches(loadRecentSearches());
      setShowDropdown(true);
      setTimeout(() => searchRef.current?.focus(), 100);
    } else {
      setShowDropdown(false);
    }
  };

  const handleFocus = () => {
    setRecentSearches(loadRecentSearches());
    if (!searchQuery) setShowDropdown(true);
  };

  const handleBlur = () => {
    // Delay to allow clicks on dropdown items
    setTimeout(() => {
      if (!searchQuery) setSearchOpen(false);
      setShowDropdown(false);
    }, 200);
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
              placeholder="Titles, people, genres..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            {searchOpen && searchQuery && (
              <button type="button" className="navbar__search-clear" onClick={handleClearSearch}>
                <X size={14} />
              </button>
            )}
          </form>
          {searchOpen && showDropdown && !searchQuery && recentSearches.length > 0 && (
            <div className="navbar__search-dropdown" ref={dropdownRef}>
              <div className="navbar__search-dropdown-header">
                <span>Recent Searches</span>
                <button type="button" onClick={handleClearRecent}>Clear</button>
              </div>
              {recentSearches.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="navbar__search-dropdown-item"
                  onMouseDown={() => handleRecentClick(q)}
                >
                  <Search size={14} />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          )}
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
