import { useEffect, useState } from 'react';
import { listResource, createResource, updateResource, deleteResource } from '../api/client';

function ListingPage() {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [mode, setMode] = useState('list');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
  });
  const [formStatus, setFormStatus] = useState('idle');
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (mode === 'list') {
      loadListings();
    }
  }, [mode]);

  async function loadListings() {
    setStatus('loading');
    const controller = new AbortController();
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

  async function handleSubmit(e) {
    e.preventDefault();
    setFormStatus('loading');
    setFormError(null);

    const nextId = listings.length > 0 ? Math.max(...listings.map(l => l.id || 0)) + 1 : 1;
    
    const payload = {
      title: formData.title,
      description: formData.description,
      price: formData.price ? parseFloat(formData.price) : 0,
      machineId: nextId,
      userId: nextId,
    };

    let result;
    if (mode === 'create') {
      result = await createResource('Listing', payload);
    } else if (mode === 'edit') {
      result = await updateResource('Listing', selectedListing.id, payload);
    }

    if (result.error) {
      setFormError(result.error);
      setFormStatus('error');
      return;
    }

    setFormStatus('success');
    resetForm();
    setMode('list');
  }

  async function handleDelete(id) {
    if (!confirm('Er du sikker på, at du vil slette denne annonce?')) {
      return;
    }

    const { error: requestError } = await deleteResource('Listing', id);
    
    if (requestError) {
      setError(requestError);
      return;
    }

    if (mode === 'edit') {
      setMode('list');
    } else {
      loadListings();
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function startCreate() {
    resetForm();
    setMode('create');
  }

  function startEdit(listing) {
    setSelectedListing(listing);
    setFormData({
      title: listing.title || '',
      description: listing.description || '',
      price: listing.price?.toString() || '',
    });
    setMode('edit');
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      price: '',
    });
    setFormStatus('idle');
    setFormError(null);
    setSelectedListing(null);
  }

  function backToList() {
    setMode('list');
    resetForm();
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <section className="page">
        <header className="page__header">
          <p className="eyebrow">{mode === 'create' ? 'Opret' : 'Rediger'}</p>
          <h1>{mode === 'create' ? 'Ny annonce' : 'Rediger annonce'}</h1>
        </header>

        {formError && (
          <p className="callout callout--warning">
            {formError.message}
            {formError.status ? ` (HTTP ${formError.status})` : ''}
          </p>
        )}

        <form onSubmit={handleSubmit} className="panel">
          <div className="field">
            <label htmlFor="title">Titel *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="price">Pris</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
            />
          </div>

          <div className="field">
            <label htmlFor="description">Beskrivelse</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="button" disabled={formStatus === 'loading'}>
              {formStatus === 'loading' 
                ? 'Gemmer...' 
                : mode === 'create' ? 'Opret' : 'Gem'}
            </button>
            <button type="button" className="button button--secondary" onClick={backToList}>
              Annuller
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Oversigt</p>
        <h1>Alle annoncer</h1>
      </header>

      <div style={{ marginBottom: '1rem' }}>
        <button className="button" onClick={startCreate}>
          + Opret ny
        </button>
      </div>

      {status === 'loading' && <p className="callout">Henter annoncer…</p>}
      {error && (
        <p className="callout callout--warning">
          {error.message}
          {error.status ? ` (HTTP ${error.status})` : ''}. Tjek API-base-URL.
        </p>
      )}

      <div className="listing-grid">
        {listings.length === 0 && status === 'success' && (
          <div className="panel">
            <h2>Ingen annoncer fundet</h2>
            <p className="muted">Opret en annonce for at komme i gang.</p>
          </div>
        )}

        {listings.map((listing) => (
          <article className="panel listing-card" key={listing.id}>
            <div className="panel__header">
              <span className="tag">#{listing.id}</span>
              <strong>{listing.title || 'Untitled'}</strong>
            </div>
            <p className="muted">{listing.description || 'Ingen beskrivelse'}</p>
            <div className="listing-meta">
              <div>
                <p className="meta-label">Maskine</p>
                <p className="meta-value">{listing.machineId ?? '—'}</p>
              </div>
              <div>
                <p className="meta-label">Ejer</p>
                <p className="meta-value">{listing.userId ?? '—'}</p>
              </div>
              <div>
                <p className="meta-label">Pris</p>
                <p className="meta-value pill pill--muted">
                  {listing.price ? `$${Number(listing.price).toLocaleString()}` : '—'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="button button--small" onClick={() => startEdit(listing)}>
                Rediger
              </button>
              <button className="button button--small button--danger" onClick={() => handleDelete(listing.id)}>
                Slet
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ListingPage;
