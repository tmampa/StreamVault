export default function SkeletonCard() {
  return (
    <div className="content-card skeleton-card">
      <div className="content-card__poster skeleton-shimmer" />
      <div className="content-card__info">
        <div className="skeleton-line skeleton-shimmer" style={{ width: '80%', height: 14 }} />
        <div className="skeleton-line skeleton-shimmer" style={{ width: '40%', height: 12, marginTop: 6 }} />
      </div>
    </div>
  );
}
