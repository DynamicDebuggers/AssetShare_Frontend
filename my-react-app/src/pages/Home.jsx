import { useEffect, useState } from 'react';
import { listResource } from '../api/client';

function HomePage() {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadListings() {
      setStatus('loading');
      const { data, error: requestError } = await listResource('Listing', controller.signal);
      if (requestError) {
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
        <p className="eyebrow">Dashboard</p>
        <h1>Open Listings</h1>
        <p className="lede">
          Live data from the Listing endpoint. Use this page as the entry point for your crew to
          see what work is available.
        </p>
      </header>

      {status === 'loading' && <p className="callout">Loading listings…</p>}
      {error && (
        <p className="callout callout--warning">
          {error.message}
          {error.status ? ` (HTTP ${error.status})` : ''}. Check your API base URL.
        </p>
      )}

      <div className="listing-grid">
        {listings.length === 0 && status === 'success' && (
          <div className="panel">
            <h2>No listings found</h2>
            <p className="muted">Create a listing to populate this dashboard.</p>
          </div>
        )}

        {listings.map((listing) => (
          <article className="panel listing-card" key={listing.id || listing.name}>
            <div className="panel__header">
              <span className="tag">Listing</span>
              <strong>{listing.title || listing.name || 'Untitled'}</strong>
            </div>
            <p className="muted">
              {listing.description || listing.summary || 'No description provided.'}
            </p>
            <div className="listing-meta">
              <div>
                <p className="meta-label">ID</p>
                <p className="meta-value">{listing.id || '—'}</p>
              </div>
              <div>
                <p className="meta-label">Status</p>
                <p className="meta-value pill pill--muted">{listing.status || 'Unknown'}</p>
              </div>
              <div>
                <p className="meta-label">Owner</p>
                <p className="meta-value">{listing.owner || listing.createdBy || 'Unassigned'}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HomePage;
