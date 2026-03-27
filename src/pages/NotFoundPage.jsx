import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <Helmet>
        <title>Page not found — Owl</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="not-found__title">404</h1>
      <p className="not-found__text">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn--primary">
        <ArrowLeft size={16} /> Back to Home
      </Link>
    </div>
  );
}
