import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createResource, getStoredUserId, listResource } from '../api/client';

const INITIAL_FORM = {
  title: '',
  description: '',
  price: '',
  location: '',
};

function buildPayload(form, userId, nextMachineId) {
  return Object.entries({
    title: form.title.trim(),
    description: form.description.trim(),
    price: form.price ? Number(form.price) : 0,
    location: form.location.trim(),
    machineId: nextMachineId,
    userId,
  }).reduce((payload, [key, value]) => {
    if (value !== undefined && value !== '') {
      payload[key] = value;
    }
    return payload;
  }, {});
}

function ListingNewPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [nextMachineId, setNextMachineId] = useState(null);
  const [loadingMachineId, setLoadingMachineId] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchNextMachineId() {
      setLoadingMachineId(true);
      const { data } = await listResource('Listing');
      
      if (data && Array.isArray(data) && data.length > 0) {
        const maxId = Math.max(...data.map(listing => listing.machineId || listing.MachineId || 0));
        setNextMachineId(maxId + 1);
      } else {
        setNextMachineId(1);
      }
      setLoadingMachineId(false);
    }
    
    fetchNextMachineId();
  }, []);

  const hasRequiredFields = Boolean(form.title.trim() && form.description.trim());

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }


  async function handleSubmit(event) {
    event.preventDefault();
    const userId = getStoredUserId();

    if (!userId) {
      setResult({ error: { message: 'Log ind for at oprette en annonce.' } });
      return;
    }

    if (!hasRequiredFields) {
      setResult({ error: { message: 'Titel og beskrivelse er paakraevet.' } });
      return;
    }

    if (nextMachineId === null) {
      setResult({ error: { message: 'Henter maskine ID...' } });
      return;
    }

    setSubmitting(true);
    setResult(null);

    // Først: Opret maskine
    const machinePayload = {
      userId,
      title: form.title.trim(),
      description: form.description.trim(),
      price: form.price ? Number(form.price) : 0,
      location: form.location.trim(),
    };
    const { data: machine, error: machineError } = await createResource('machine', machinePayload);
    if (machineError) {
      setResult({ error: machineError });
      setSubmitting(false);
      return;
    }

    // Dernæst: Opret annonce med maskinens id
    const listingPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: form.price ? Number(form.price) : 0,
      location: form.location.trim(),
      machineId: machine.id || machine.Id,
      userId,
    };
    const { data: listing, error: listingError } = await createResource('Listing', listingPayload);
    if (listingError) {
      setResult({ error: listingError });
      setSubmitting(false);
      return;
    }

    setResult({ data: listing });
    setForm(INITIAL_FORM);
    setSubmitting(false);
    // Increment for next use
    setNextMachineId(nextMachineId + 1);
    navigate('/listings');
  }

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Opret</p>
        <h1>Ny annonce</h1>
      </header>

      <div className="panel-grid">
        <div className="panel">
          {loadingMachineId && (
            <div className="callout">Henter næste maskine ID...</div>
          )}
          
          <form className="field" onSubmit={handleSubmit}>
            <label className="field">
              <span>Titel *</span>
              <input type="text" value={form.title} onChange={updateField('title')} />
            </label>
            <label className="field">
              <span>Beskrivelse *</span>
              <textarea
                rows="4"
                value={form.description}
                onChange={updateField('description')}
              />
            </label>
            <label className="field">
              <span>Pris</span>
              <input type="number" value={form.price} onChange={updateField('price')} />
            </label>
            <label className="field">
              <span>Sted</span>
              <input type="text" value={form.location} onChange={updateField('location')} />
            </label>

            <button className="button" type="submit" disabled={!hasRequiredFields || submitting || loadingMachineId}>
              {submitting ? 'Opretter...' : 'Opret annonce'}
            </button>
          </form>


          {result?.error ? (
            <div className="callout callout--warning">
              <strong>Fejl:</strong> {result.error.message}
              {result.error.status ? ` (HTTP ${result.error.status})` : ''}
              {result.error.details ? (
                <pre style={{ whiteSpace: 'pre-wrap', color: 'crimson', marginTop: 8 }}>{JSON.stringify(result.error.details, null, 2)}</pre>
              ) : null}
            </div>
          ) : null}

          {result?.data ? <div className="callout">Annonce oprettet.</div> : null}
        </div>
      </div>
    </section>
  );
}

export default ListingNewPage;
