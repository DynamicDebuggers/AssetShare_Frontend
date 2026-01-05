import { useState, useEffect } from 'react';
import { getReviewsByListing, getAverageRating } from '../api/client';
import '../styles/ReviewList.css';

export default function ReviewList({ listingId }) {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const [reviewsResult, ratingResult] = await Promise.all([
          getReviewsByListing(listingId),
          getAverageRating(listingId),
        ]);
        setReviews(reviewsResult.data || []);
        setAvgRating(ratingResult.data || 0);
      } catch (err) {
        setError(err.message || 'Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [listingId]);

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.round(rating));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) return <div className="loading">Henter anmeldelser...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="review-list">
      <div className="rating-summary">
        <h3>Kundeanmeldelser</h3>
        <div className="avg-rating">
          <span className="stars">{renderStars(avgRating)}</span>
          <span className="rating-value">
            {avgRating.toFixed(1)} / 5
          </span>
          <span className="review-count">({reviews.length} anmeldelser)</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="no-reviews">Ingen anmeldelser endnu. Vær den første til at anmelde!</p>
      ) : (
        <div className="reviews">
          {reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="review-rating">
                  {renderStars(review.rating)}
                  <span className="rating-number">{review.rating}.0</span>
                </div>
                <div className="review-meta">
                  <h4>{review.title}</h4>
                  <p className="review-date">{formatDate(review.createdAt)}</p>
                </div>
              </div>
              <p className="review-content">{review.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
