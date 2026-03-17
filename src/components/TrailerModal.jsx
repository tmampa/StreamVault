import { X } from 'lucide-react';

export default function TrailerModal({ videos, onClose }) {
  const trailer =
    videos?.results?.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
    videos?.results?.find((v) => v.site === 'YouTube');

  if (!trailer) return null;

  return (
    <div className="trailer-modal" onClick={onClose}>
      <div className="trailer-modal__content" onClick={(e) => e.stopPropagation()}>
        <button className="trailer-modal__close" onClick={onClose}>
          <X size={24} />
        </button>
        <iframe
          src={`https://www.youtube.com/embed/${encodeURIComponent(trailer.key)}?autoplay=1`}
          allowFullScreen
          allow="autoplay; fullscreen"
          title={trailer.name}
        />
      </div>
    </div>
  );
}
