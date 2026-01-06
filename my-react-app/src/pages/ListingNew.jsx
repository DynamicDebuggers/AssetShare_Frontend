import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createResource, getStoredUserId } from '../api/client';

const INITIAL_FORM = {
  title: '',
  description: '',
  price: '',
  location: '',
  machineId: '',
};

function buildPayload(form, userId) {
  return Object.entries({
    title: form.title.trim(),
    description: form.description.trim(),
    price: form.price ? Number(form.price) : 0,
    location: form.location.trim(),
    machineId: form.machineId ? Number(form.machineId) : undefined,
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
  const navigate = useNavigate();

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

    setSubmitting(true);
    setResult(null);

    const payload = buildPayload(form, userId);
    const { data, error } = await createResource('Listing', payload);
    if (error) {
      setResult({ error });
      setSubmitting(false);
      return;
    }

    setResult({ data });
    setForm(INITIAL_FORM);
    setSubmitting(false);
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
            <label className="field">
              <span>Maskine ID</span>
              <input type="number" value={form.machineId} onChange={updateField('machineId')} />
            </label>

            <button className="button" type="submit" disabled={!hasRequiredFields || submitting}>
              {submitting ? 'Opretter...' : 'Opret annonce'}
            </button>
          </form>

          {result?.error ? (
            <div className="callout callout--warning">
              <strong>Fejl:</strong> {result.error.message}
              {result.error.status ? ` (HTTP ${result.error.status})` : ''}
            </div>
          ) : null}

          {result?.data ? <div className="callout">Annonce oprettet.</div> : null}
        </div>
      </div>
    </section>
  );
}

export default ListingNewPage;
