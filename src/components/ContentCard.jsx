import { Link } from 'react-router-dom';
import { imgUrl } from '../api/tmdb';

export default function ContentCard({ item }) {
  const title = item.title || item.name;
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const poster = imgUrl(item.poster_path, 'w342');

  const ratingClass = rating >= 7 ? 'high' : rating >= 5 ? 'mid' : 'low';
  const linkTo = `/${mediaType}/${item.id}`;

  return (
    <Link to={linkTo} className="content-card">
      <div className="content-card__poster">
        {poster ? (
          <img src={poster} alt={title} loading="lazy" />
        ) : (
          <div className="no-poster">No Image</div>
        )}
        <div className="content-card__overlay">
          <div className="content-card__play-btn">▶</div>
        </div>
        {rating && (
          <span className={`content-card__rating content-card__rating--${ratingClass}`}>
            ★ {rating}
          </span>
        )}
      </div>
      <div className="content-card__info">
        <div className="content-card__title">{title}</div>
        {year && <div className="content-card__year">{year}</div>}
      </div>
    </Link>
  );
}
