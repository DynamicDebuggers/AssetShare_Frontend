import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listResource } from '../api/client';

function HomePage() {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const formattedListings = useMemo(() => {
    return listings.map((listing) => ({
      id: listing.id ?? '-',
      title: listing.title || listing.Title || 'Navn mangler',
      description: listing.description || listing.Description || 'Ingen beskrivelse.',
      price: listing.price ?? listing.Price ?? null,
      location: listing.location || listing.Location || '—',
    }));
  }, [listings]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadListings() {
      setStatus('loading');
      const { data, error: requestError } = await listResource('Listing', controller.signal);
      if (requestError) {
        if (requestError.aborted) {
          setStatus('idle');
          return;
        }
        setError(requestError);
        setListings([]);
        setStatus('error');
        return;
      }
      setListings(Array.isArray(data) ? data : []);
      setStatus('success');
    }

    loadListings();
    return () => controller.abort();
  }, []);

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Oversigt</p>
        <h1>Tilgængelige maskiner</h1>
        <p className="lede">
          Her finder du maskiner til leje og kan sammenligne annoncer fra udlejere.
        </p>
      </header>

      {status === 'loading' && <p className="callout">Henter maskiner...</p>}
      {error && (
        <p className="callout callout--warning">
          {error.message}
          {error.status ? ` (HTTP ${error.status})` : ''}. Tjek API-base-URL.
        </p>
      )}

      <div className="listing-grid">
        {formattedListings.length === 0 && status === 'success' && (
          <div className="panel">
            <h2>Ingen maskiner fundet</h2>
            <p className="muted">Prøv at justere søgningen eller opret en maskine.</p>
          </div>
        )}

        {formattedListings.map((listing) => {
          const cardContent = (
            <>
              <div className="panel__header">
                <span className="tag">Maskine</span>
                <strong>{listing.title}</strong>
              </div>
              <p className="muted">{listing.description}</p>
              <div className="listing-meta">
                <div>
                  <p className="meta-label">ID</p>
                  <p className="meta-value">{listing.id !== '-' ? listing.id : '—'}</p>
                </div>
                <div>
                  <p className="meta-label">Pris</p>
                  <p className="meta-value pill pill--muted">
                    {listing.price === null || listing.price === undefined
                      ? '—'
                      : `${Number(listing.price).toLocaleString()} kr.`}
                  </p>
                </div>
                <div>
                  <p className="meta-label">Sted</p>
                  <p className="meta-value">{listing.location}</p>
                </div>
              </div>
            </>
          );

          if (listing.id !== '-') {
            return (
              <Link
                key={listing.id}
                to={`/listings/${listing.id}`}
                className="panel listing-card listing-card-link"
              >
                {cardContent}
              </Link>
            );
          }

          return (
            <article key={listing.id} className="panel listing-card">
              {cardContent}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default HomePage;


// Mads Refaktorering

// Hvad jeg skal undersøge:
// - Hvad gør de importerede ressourcer?
// - Hvad gør funktionerne?
// - Hvorfor returnerer man siden?