// Importerer useState og useEffect fra React, så vi kan lave state-variabler og sideeffekter
import { useState, useEffect } from 'react';
// Importerer API-funktioner til at hente anmeldelser og gennemsnitlig rating
import { getReviewsByListing, getAverageRating } from '../api/client';
// Importerer CSS-styling til anmeldelseslisten
import '../styles/ReviewList.css';

// Komponent der viser en liste af anmeldelser for en annonce
// Props:
// - listingId: id på den annonce der vises anmeldelser for
export default function ReviewList({ listingId }) {
  // State til at holde alle anmeldelser
  const [reviews, setReviews] = useState([]);
  // State til at holde gennemsnitlig rating
  const [avgRating, setAvgRating] = useState(0);
  // State til at vise om vi er i gang med at hente data
  const [loading, setLoading] = useState(true);
  // State til fejlbesked hvis noget går galt
  const [error, setError] = useState(null);

  // useEffect kører når komponenten vises eller listingId ændrer sig
  useEffect(() => {
    // Funktion der henter anmeldelser og rating fra API'et
    const fetchReviews = async () => {
      try {
        setLoading(true); // Vis loading
        // Hent både anmeldelser og rating parallelt
        const [reviewsResult, ratingResult] = await Promise.all([
          getReviewsByListing(listingId), // Hent anmeldelser
          getAverageRating(listingId),    // Hent gennemsnitlig rating
        ]);
        setReviews(reviewsResult.data || []); // Gem anmeldelser
        setAvgRating(ratingResult.data || 0); // Gem rating
      } catch (err) {
        // Hvis der opstår fejl, vis besked
        setError(err.message || 'Failed to fetch reviews');
      } finally {
        setLoading(false); // Fjern loading
      }
    };

    fetchReviews(); // Kald funktionen
  }, [listingId]);

  // Funktion der viser stjerner ud fra rating
  const renderStars = (rating) => {
    // Gentager stjerne-tegnet så mange gange som ratingen
    return '\u2b50'.repeat(Math.round(rating));
  };

  // Funktion der formaterer en dato til læsbart format
  const formatDate = (dateString) => {
    // Bruger toLocaleDateString til at vise datoen pænt
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Hvis vi er i gang med at hente, vis loading
  if (loading) return <div className="loading">Henter anmeldelser...</div>;
  // Hvis der er fejl, vis fejlbesked
  if (error) return <div className="error">{error}</div>;

  // Returnerer hele UI'et for anmeldelseslisten
  return (
    <div className="review-list">
      {/* Sektion med oversigt over rating */}
      <div className="rating-summary">
        <h3>Kundeanmeldelser</h3>
        <div className="avg-rating">
          {/* Viser stjerner */}
          <span className="stars">{renderStars(avgRating)}</span>
          {/* Viser tallet for rating */}
          <span className="rating-value">
            {avgRating.toFixed(1)} / 5
          </span>
          {/* Viser hvor mange anmeldelser der er */}
          <span className="review-count">({reviews.length} anmeldelser)</span>
        </div>
      </div>

      {/* Hvis der ikke er nogen anmeldelser, vis besked */}
      {reviews.length === 0 ? (
        <p className="no-reviews">Ingen anmeldelser endnu. Vær den første til at anmelde!</p>
      ) : (
        // Ellers vis alle anmeldelser
        <div className="reviews">
          {reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="review-rating">
                  {/* Viser stjerner for denne anmeldelse */}
                  {renderStars(review.rating)}
                  {/* Viser tallet for rating */}
                  <span className="rating-number">{review.rating}.0</span>
                </div>
                <div className="review-meta">
                  {/* Titel på anmeldelsen */}
                  <h4>{review.title}</h4>
                  {/* Dato for anmeldelsen */}
                  <p className="review-date">{formatDate(review.createdAt)}</p>
                </div>
              </div>
              {/* Selve anmeldelsesteksten */}
              <p className="review-content">{review.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
