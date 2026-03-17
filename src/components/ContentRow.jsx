import { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ContentCard from './ContentCard';

export default function ContentRow({ title, items, seeAllLink }) {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.offsetWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="content-section">
      <div className="content-section__header">
        <h2 className="content-section__title">{title}</h2>
        {seeAllLink && (
          <a href={seeAllLink} className="content-section__see-all">
            See All <ArrowRight size={16} />
          </a>
        )}
      </div>
      <div className="content-row__scroll-wrapper">
        <button
          className="content-row__scroll-btn content-row__scroll-btn--left"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="content-row" ref={rowRef}>
          {items.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
        <button
          className="content-row__scroll-btn content-row__scroll-btn--right"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </section>
  );
}
