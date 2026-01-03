import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listResource } from '../api/client';

function HomePage() {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const formattedListings = useMemo(() => {
    return listings.map((listing) => ({
      id: listing.id ?? '-',
      title: listing.title || listing.Title || 'Navn mangler',
      description: listing.description || listing.Description || 'Ingen beskrivelse.',
      price: listing.price ?? listing.Price ?? null,
      location: listing.location || listing.Location || '—',
    }));
  }, [listings]);

  const filteredListings = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return formattedListings;
    return formattedListings.filter((listing) => {
      return (
        String(listing.id).toLowerCase().includes(term) ||
        listing.title.toLowerCase().includes(term) ||
        listing.description.toLowerCase().includes(term) ||
        listing.location.toLowerCase().includes(term) ||
        String(listing.price ?? '').toLowerCase().includes(term)
      );
    });
  }, [formattedListings, query]);

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
          Find maskiner til leje og klik dig ind for at se flere detaljer.
        </p>
        <div className="search-bar">
          <label className="field">
            <span>Søg efter en maskine</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Søg efter titel, sted eller pris"
              autoComplete="off"
            />
          </label>
          <span className="muted">
            Viser {filteredListings.length} ud af {formattedListings.length} maskiner
          </span>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/listings" className="button">
            Administrer annoncer
          </Link>
        </div>
      </header>

      {status === 'loading' && <p className="callout">Henter maskiner...</p>}
      {error && (
        <p className="callout callout--warning">
          {error.message}
          {error.status ? ` (HTTP ${error.status})` : ''}. Tjek API-base-URL.
        </p>
      )}

      <div className="listing-grid">
        {filteredListings.length === 0 && status === 'success' && (
          <div className="panel">
            <h2>Ingen maskiner fundet</h2>
            <p className="muted">Prøv at justere søgningen eller opret en maskine.</p>
          </div>
        )}

        {filteredListings.map((listing) => {
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
