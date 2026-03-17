import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <h1 className="not-found__title">404</h1>
      <p className="not-found__text">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn--primary">
        ← Back to Home
      </Link>
    </div>
  );
}
