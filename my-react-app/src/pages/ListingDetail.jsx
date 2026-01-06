import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createResource, getResource, getStoredUserId } from '../api/client';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';

function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [bookingPeriod, setBookingPeriod] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadListing() {
      if (!id) return;
      setStatus('loading');
      setError(null);

      const { data, error: requestError } = await getResource('Listing', id, controller.signal);
      if (requestError) {
        if (requestError.aborted) {
          setStatus('idle');
          return;
        }
        setError(requestError);
        setStatus('error');
        return;
      }

      // Rens listing ID ved at tage alt før ":"
      if (data && data.id) {
        data.id = parseInt(String(data.id).split(':')[0]);
      }

      setListing(data);
      setStatus('success');
    }

    loadListing();
    return () => controller.abort();
  }, [id]);

  const title = listing?.title || listing?.Title || `Annonce #${id}`;
  const description = listing?.description || listing?.Description || '';
  const price = listing?.price ?? listing?.Price ?? null;
  const location = listing?.location || listing?.Location || '—';
  const machineId =
    listing?.machineId ??
    listing?.MachineId ??
    listing?.machineID ??
    listing?.MachineID ??
    null;

  const userId = getStoredUserId();

  function toIsoString(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }

  async function handleBooking(event) {
    event.preventDefault();
    setBookingStatus(null);

    if (!userId) {
      setBookingStatus({ error: { message: 'Log ind for at booke en maskine.' } });
      return;
    }

    if (!machineId) {
      setBookingStatus({ error: { message: 'Kan ikke finde maskine id på annoncen.' } });
      return;
    }

    const periodIso = toIsoString(bookingPeriod);
    if (!periodIso) {
      setBookingStatus({ error: { message: 'Vælg et gyldigt tidspunkt.' } });
      return;
    }

    setBookingSubmitting(true);

    const payload = {
      id: 0,
      rentedByUserId: userId,
      bookedMachineId: machineId,
      period: periodIso,
      status: true,
    };

    const { data, error: bookingError } = await createResource('Booking', payload);
    if (bookingError) {
      setBookingStatus({ error: bookingError });
      setBookingSubmitting(false);
      return;
    }

    setBookingStatus({ data });
    setBookingSubmitting(false);
  }

  const handleReviewCreated = () => {
    // Trigger a refresh of the review list
    setRefreshReviews(prev => prev + 1);
  };

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Annonce</p>
        <h1>{title}</h1>
      </header>

      {status === 'loading' && <p className="callout">Henter annonce...</p>}
      {error && (
        <div className="callout callout--warning">
          <strong>Fejl:</strong> {error.message}
          {error.status ? ` (HTTP ${error.status})` : ''}
        </div>
      )}

      {listing && (
        <>
          <div className="panel">
            <div className="listing-meta">
              <div>
                <p className="meta-label">Pris</p>
                <p className="meta-value pill pill--muted">
                  {price === null || price === undefined
                    ? '—'
                    : `${Number(price).toLocaleString()} kr.`}
                </p>
              </div>
              <div>
                <p className="meta-label">Sted</p>
                <p className="meta-value">{location}</p>
              </div>
              <div>
                <p className="meta-label">Maskine ID</p>
                <p className="meta-value">{machineId ?? '—'}</p>
              </div>
            </div>

            {description ? <p className="muted">{description}</p> : null}
          </div>

          <form className="panel field" onSubmit={handleBooking}>
            <div className="panel__header">
              <span className="tag">Booking</span>
              <strong>Book maskinen</strong>
            </div>
            <label className="field">
              <span>Periode</span>
              <input
                type="datetime-local"
                value={bookingPeriod}
                onChange={(event) => setBookingPeriod(event.target.value)}
              />
            </label>

            {bookingStatus?.error ? (
              <div className="callout callout--warning">
                <strong>Fejl:</strong> {bookingStatus.error.message}
                {bookingStatus.error.status ? ` (HTTP ${bookingStatus.error.status})` : ''}
              </div>
            ) : null}

            {bookingStatus?.data ? (
              <div className="callout">Booking oprettet.</div>
            ) : null}

            <button className="button" type="submit" disabled={bookingSubmitting}>
              {bookingSubmitting ? 'Booker...' : 'Book maskine'}
            </button>
          </form>

          {/* Reviews Section */}
          <ReviewList listingId={Number(listing.id)} key={refreshReviews} />
          
          {userId && (
            <ReviewForm 
              listingId={Number(listing.id)} 
              userId={userId}
              onReviewCreated={handleReviewCreated}
            />
          )}
        </>
      )}
    </section>
  );
}

export default ListingDetailPage;
