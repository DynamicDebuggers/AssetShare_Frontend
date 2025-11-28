import { useEffect, useMemo, useState } from 'react';
import { listResource } from '../api/client';

function HomePage() {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const formattedListings = useMemo(() => {
    return listings.map((listing) => ({
      id: listing.id ?? '-',
      title: listing.title || 'Untitled listing',
      description: listing.description || 'No description provided.',
      price: listing.price ?? null,
      machineId: listing.machineId ?? '—',
      userId: listing.userId ?? '—',
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
        <h1>Åbne opslag</h1>
        <p className="lede">
          Live data fra Listing-endepunktet. Brug siden som startpunkt for holdet til at se ledige
          opgaver.
        </p>
      </header>

      {status === 'loading' && <p className="callout">Henter opslag…</p>}
      {error && (
        <p className="callout callout--warning">
          {error.message}
          {error.status ? ` (HTTP ${error.status})` : ''}. Tjek API-base-URL.
        </p>
      )}

      <div className="listing-grid">
        {formattedListings.length === 0 && status === 'success' && (
          <div className="panel">
            <h2>Ingen opslag fundet</h2>
            <p className="muted">Opret et opslag for at udfylde oversigten.</p>
          </div>
        )}

        {formattedListings.map((listing) => (
          <article className="panel listing-card" key={listing.id}>
            <div className="panel__header">
              <span className="tag">Listing</span>
              <strong>{listing.title}</strong>
            </div>
            <p className="muted">{listing.description}</p>
            <div className="listing-meta">
              <div>
                <p className="meta-label">ID</p>
                <p className="meta-value">{listing.id}</p>
              </div>
              <div>
                <p className="meta-label">Maskine</p>
                <p className="meta-value">{listing.machineId}</p>
              </div>
              <div>
                <p className="meta-label">Ejer (bruger)</p>
                <p className="meta-value">{listing.userId}</p>
              </div>
              <div>
                <p className="meta-label">Pris</p>
                <p className="meta-value pill pill--muted">
                  {listing.price === null ? '—' : `$${Number(listing.price).toLocaleString()}`}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HomePage;
