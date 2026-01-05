import { useState } from 'react';
import { createResource } from '../api/client';
import '../styles/ReviewForm.css';

export default function ReviewForm({ listingId, userId, onReviewCreated }) {
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    content: '',
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'rating' ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: err } = await createResource('Review', {
        listingId,
        userId,
        ...formData,
      });

      if (err) throw new Error(err.message || 'Failed to create review');

      setFormData({ rating: 5, title: '', content: '' });
      if (onReviewCreated) onReviewCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form">
      <h3>Skriv en anmeldelse</h3>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
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
          <small>{formData.title.length}/200</small>
        </div>

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
          <small>{formData.content.length}/5000</small>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Indsender...' : 'Send anmeldelse'}
        </button>
      </form>
    </div>
  );
}
