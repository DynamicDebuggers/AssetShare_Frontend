import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listResource, updateResource, deleteResource } from '../api/client';

function ListingPage() {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [mode, setMode] = useState('list');
  const [query, setQuery] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [maxDistanceKm, setMaxDistanceKm] = useState('');
  const [rentedOnly, setRentedOnly] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
  });
  const [formStatus, setFormStatus] = useState('idle');
  const [formError, setFormError] = useState(null);
  const navigate = useNavigate();

  const filteredListings = useMemo(() => {
    const term = query.trim().toLowerCase();
    const minPriceValue = priceMin === '' ? null : Number(priceMin);
    const maxPriceValue = priceMax === '' ? null : Number(priceMax);
    const maxDistanceValue = maxDistanceKm === '' ? null : Number(maxDistanceKm);

    return listings.filter((listing) => {
      const id = String(listing.id ?? '');
      const title = String(listing.title || listing.Title || '');
      const description = String(listing.description || listing.Description || '');
      const location = String(listing.location || listing.Location || '');
      const price = String(listing.price ?? listing.Price ?? '');
      const machineId = String(listing.machineId ?? listing.MachineId ?? '');
      const userId = String(listing.userId ?? listing.UserId ?? '');

      const matchesSearch =
        !term ||
        id.toLowerCase().includes(term) ||
        title.toLowerCase().includes(term) ||
        description.toLowerCase().includes(term) ||
        location.toLowerCase().includes(term) ||
        price.toLowerCase().includes(term) ||
        machineId.toLowerCase().includes(term) ||
        userId.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      const numericPrice =
        listing.price ?? listing.Price ?? (price ? Number(price) : null);
      const priceValue = Number.isNaN(Number(numericPrice)) ? null : Number(numericPrice);

      if (minPriceValue !== null && (priceValue === null || priceValue < minPriceValue)) {
        return false;
      }

      if (maxPriceValue !== null && (priceValue === null || priceValue > maxPriceValue)) {
        return false;
      }

      if (maxDistanceValue !== null) {
        const distanceRaw =
          listing.distanceKm ?? listing.DistanceKm ?? listing.distance ?? listing.Distance ?? null;
        const distanceValue = Number.isNaN(Number(distanceRaw)) ? null : Number(distanceRaw);
        if (distanceValue === null || distanceValue > maxDistanceValue) {
          return false;
        }
      }

      if (rentedOnly) {
        const statusRaw =
          listing.status ?? listing.Status ?? listing.isRented ?? listing.rented ?? null;
        let isRented = false;
        if (typeof statusRaw === 'boolean') {
          isRented = statusRaw;
        } else if (typeof statusRaw === 'number') {
          isRented = statusRaw === 1;
        } else if (typeof statusRaw === 'string') {
          const normalized = statusRaw.toLowerCase().trim();
          isRented = ['true', 'rented', 'udlejet', 'booked', 'busy'].includes(normalized);
        }
        if (!isRented) return false;
      }

      return true;
    });
  }, [listings, query, priceMin, priceMax, maxDistanceKm, rentedOnly]);

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

    const payload = {
      title: formData.title,
      description: formData.description,
      price: formData.price ? parseFloat(formData.price) : 0,
      machineId: selectedListing?.machineId ?? null,
      userId: selectedListing?.userId ?? null,
    };

    const result = await updateResource('Listing', selectedListing.id, payload);

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

  function handleCardClick(id, event) {
    if (event.defaultPrevented) return;
    const interactive = event.target?.closest?.('a, button, input, textarea, select, label');
    if (interactive) return;
    navigate(`/listings/${id}`);
  }

  function handleCardKeyDown(id, event) {
    if (event.defaultPrevented) return;
    const interactive = event.target?.closest?.('a, button, input, textarea, select, label');
    if (interactive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(`/listings/${id}`);
    }
  }

  if (mode === 'edit') {
    return (
      <section className="page">
        <header className="page__header">
          <p className="eyebrow">Rediger</p>
          <h1>Rediger annonce</h1>
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
              {formStatus === 'loading' ? 'Gemmer...' : 'Gem'}
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
    <section className="page page--listings">
      <header className="page__header">
        <p className="eyebrow">Oversigt</p>
        <h1>Alle annoncer</h1>
      </header>



      <div className="listing-layout">
        <aside className="filters-column">
          <div className="panel filters-panel">
            <div className="panel__header">
              <span className="tag">Filter</span>
              <strong>Filtrer annoncer</strong>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Pris fra</span>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(event) => setPriceMin(event.target.value)}
                  placeholder="Min. pris"
                />
              </label>
              <label className="field">
                <span>Pris til</span>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(event) => setPriceMax(event.target.value)}
                  placeholder="Maks. pris"
                />
              </label>
              <label className="field">
                <span>Afstand (km)</span>
                <input
                  type="number"
                  value={maxDistanceKm}
                  onChange={(event) => setMaxDistanceKm(event.target.value)}
                  placeholder="Maks. afstand"
                />
              </label>
              <label className="field" style={{ alignItems: 'flex-start' }}>
                <span>Udlejet nu</span>
                <input
                  type="checkbox"
                  checked={rentedOnly}
                  onChange={(event) => setRentedOnly(event.target.checked)}
                />
              </label>
            </div>
            <p className="muted">
              Afstand kraever et distanceKm-felt fra API'et. Uden afstandsdata kan filtre udelukke
              alle annoncer.
            </p>
          </div>
        </aside>

        <div className="listing-column">
      <div className="search-bar">
        <label className="field">
          <span>Søg efter en annonce</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Søg efter titel, sted, pris eller id"
            autoComplete="off"
          />
        </label>
        <span className="muted">
          Viser {filteredListings.length} ud af {listings.length} annoncer
        </span>
      </div>

      {status === 'loading' && <p className="callout">Henter annoncer…</p>}
      {error && (
        <p className="callout callout--warning">
          {error.message}
          {error.status ? ` (HTTP ${error.status})` : ''}. Tjek API-base-URL.
        </p>
      )}

      <div className="listing-grid">
        {filteredListings.length === 0 && status === 'success' && (
          <div className="panel">
            <h2>Ingen annoncer fundet</h2>
            <p className="muted">Opret en annonce for at komme i gang.</p>
          </div>
        )}

        {filteredListings.map((listing) => (
          <article
            className="panel listing-card"
            key={listing.id}
            role="button"
            tabIndex={0}
            onClick={(event) => handleCardClick(listing.id, event)}
            onKeyDown={(event) => handleCardKeyDown(listing.id, event)}
          >
            <div className="panel__header">
              <span className="tag">#{listing.id}</span>
              <Link className="listing-title-link" to={`/listings/${listing.id}`}>
                {listing.title || 'Untitled'}
              </Link>
            </div>
            <p className="muted">{listing.description || 'Ingen beskrivelse'}</p>
            <div className="listing-meta">
              <div>
                <p className="meta-label">Maskine</p>
                <p className="meta-value">
                  {listing.machineId != null ? (
                    <Link to={`/machines/${listing.machineId}`}>{listing.machineId}</Link>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <p className="meta-label">Ejer</p>
                <p className="meta-value">{listing.userId ?? '—'}</p>
              </div>
              <div>
                <p className="meta-label">Pris</p>
                <p className="meta-value pill pill--muted">
                  {listing.price ? `${Number(listing.price).toLocaleString()} kr` : '—'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="button button--small" onClick={() => startEdit(listing)}>
                Rediger
              </button>
              <button
                className="button button--small button--danger"
                onClick={() => handleDelete(listing.id)}
              >
                Slet
              </button>
            </div>
          </article>
        ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ListingPage;
