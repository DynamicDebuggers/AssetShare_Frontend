// Importerer useState fra React, så vi kan lave state-variabler
import { useState } from 'react';
// Importerer funktionen til at oprette en anmeldelse via API'et
import { createResource } from '../api/client';
// Importerer CSS-styling til anmeldelsesformularen
import '../styles/ReviewForm.css';

// Komponent der viser en formular til at skrive en anmeldelse
// Props:
// - listingId: id på den annonce der anmeldes
// - userId: id på brugeren der anmelder
// - onReviewCreated: callback der kaldes når anmeldelsen er oprettet
export default function ReviewForm({ listingId, userId, onReviewCreated }) {
  // State til at holde styr på formularens felter
  const [formData, setFormData] = useState({
    rating: 5,    // Standardværdi: 5 stjerner
    title: '',    // Titel på anmeldelsen
    content: '',  // Selve anmeldelsesteksten
  });

  // State til fejlbesked hvis noget går galt
  const [error, setError] = useState(null);
  // State til at vise om vi er i gang med at indsende
  const [loading, setLoading] = useState(false);

  // Funktion der opdaterer et felt i formularen når brugeren skriver
  const handleInputChange = (e) => {
    const { name, value } = e.target; // Hent navn og værdi fra input
    setFormData({
      ...formData, // Behold de andre felter
      [name]: name === 'rating' ? parseInt(value) : value, // rating skal være et tal
    });
  };

  // Funktion der håndterer indsendelse af formularen
  const handleSubmit = async (e) => {
    e.preventDefault(); // Forhindrer side reload
    setError(null);     // Nulstil fejl
    setLoading(true);   // Vis loading

    try {
      // Kald API for at oprette anmeldelsen
      const { data, error: err } = await createResource('Review', {
        listingId, // id på annoncen
        userId,    // id på brugeren
        ...formData, // resten af felterne
      });

      // Hvis der er fejl, kast en fejl
      if (err) throw new Error(err.message || 'Failed to create review');

      // Nulstil formularen hvis det lykkes
      setFormData({ rating: 5, title: '', content: '' });
      // Kald callback hvis det findes
      if (onReviewCreated) onReviewCreated(data);
    } catch (err) {
      // Hvis der opstår fejl, vis besked
      setError(err.message);
    } finally {
      // Uanset hvad, fjern loading
      setLoading(false);
    }
  };

  // Returnerer hele UI'et for anmeldelsesformularen
  return (
    <div className="review-form">
      {/* Overskrift */}
      <h3>Skriv en anmeldelse</h3>
      {/* Vis fejl hvis der er fejl */}
      {error && <div className="error-message">{error}</div>}

      {/* Selve formularen */}
      <form onSubmit={handleSubmit}>
        {/* Felt til at vælge antal stjerner */}
        <div className="form-group">
          <label htmlFor="rating">Bedømmelse:</label>
          <select
            id="rating"
            name="rating"
            value={formData.rating}
            onChange={handleInputChange}
            required
          >
            <option value={5}>5 Stjerner - Fremragende</option>
            <option value={4}>4 Stjerner - God</option>
            <option value={3}>3 Stjerner - Middel</option>
            <option value={2}>2 Stjerner - Dårlig</option>
            <option value={1}>1 Stjerne - Meget dårlig</option>
          </select>
        </div>

        {/* Felt til titel på anmeldelsen */}
        <div className="form-group">
          <label htmlFor="title">Titel:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Kort titel til din anmeldelse"
            maxLength="200"
            required
          />
          {/* Viser hvor mange tegn der er skrevet */}
          <small>{formData.title.length}/200</small>
        </div>

        {/* Felt til selve anmeldelsesteksten */}
        <div className="form-group">
          <label htmlFor="content">Anmeldelse:</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Del din detaljerede anmeldelse (minimum 10 tegn)"
            minLength="10"
            maxLength="5000"
            rows="5"
            required
          />
          {/* Viser hvor mange tegn der er skrevet */}
          <small>{formData.content.length}/5000</small>
        </div>

        {/* Knap til at indsende anmeldelsen */}
        <button type="submit" disabled={loading}>
          {loading ? 'Indsender...' : 'Send anmeldelse'}
        </button>
      </form>
    </div>
  );
}
