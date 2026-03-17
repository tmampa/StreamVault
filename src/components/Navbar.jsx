import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
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
          <span className="navbar__logo-icon">▶</span>
          StreamVault
        </Link>

        <ul className="navbar__links">
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
        </ul>

        <div className="navbar__search">
          <form onSubmit={handleSearch}>
            <button type="button" className="navbar__search-btn" onClick={toggleSearch}>
              🔍
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

        <button className="navbar__mobile-btn" onClick={toggleSearch}>
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
