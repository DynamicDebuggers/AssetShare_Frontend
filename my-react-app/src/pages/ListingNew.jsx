
// Importerer nødvendige hooks og API-funktioner
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createResource, getStoredUserId, listResource } from '../api/client';

// Startværdier for formularen
const INITIAL_FORM = {
  title: '', // Titel på annoncen
  description: '', // Beskrivelse
  price: '', // Pris
  location: '', // Sted
};

// Funktion der bygger payload til API baseret på formular, bruger-id og maskine-id
function buildPayload(form, userId, nextMachineId) {
  // Gennemløber alle felter og fjerner tomme værdier
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

// Hovedkomponent for oprettelse af ny annonce
function ListingNewPage() {
  // State til formularfelter
  const [form, setForm] = useState(INITIAL_FORM);
  // State til om vi er ved at indsende
  const [submitting, setSubmitting] = useState(false);
  // State til resultat (succes/fejl)
  const [result, setResult] = useState(null);
  // State til næste maskine-id
  const [nextMachineId, setNextMachineId] = useState(null);
  // State til om vi henter maskine-id
  const [loadingMachineId, setLoadingMachineId] = useState(true);
  // Hook til navigation
  const navigate = useNavigate();

  // useEffect henter næste maskine-id når komponenten loader
  useEffect(() => {
    async function fetchNextMachineId() {
      setLoadingMachineId(true);
      // Henter alle eksisterende annoncer for at finde højeste maskine-id
      const { data } = await listResource('Listing');
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Finder højeste maskine-id og lægger 1 til
        const maxId = Math.max(...data.map(listing => listing.machineId || listing.MachineId || 0));
        setNextMachineId(maxId + 1);
      } else {
        // Hvis ingen annoncer, start med 1
        setNextMachineId(1);
      }
      setLoadingMachineId(false);
    }
    
    fetchNextMachineId();
  }, []);

  // Tjekker om de krævede felter er udfyldt
  const hasRequiredFields = Boolean(form.title.trim() && form.description.trim());

  // Funktion der opdaterer et felt i formularen
  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  // Funktion der håndterer indsendelse af formularen
  async function handleSubmit(event) {
    // Forhindrer at siden genindlæses
    event.preventDefault();
    // Henter bruger-id fra localStorage
    const userId = getStoredUserId();

    // Hvis ikke logget ind, vis fejl
    if (!userId) {
      setResult({ error: { message: 'Log ind for at oprette en annonce.' } });
      return;
    }

    // Hvis ikke alle krævede felter er udfyldt, vis fejl
    if (!hasRequiredFields) {
      setResult({ error: { message: 'Titel og beskrivelse er påkrævet.' } });
      return;
    }

    // Hvis maskine-id ikke er klar endnu, vis fejl
    if (nextMachineId === null) {
      setResult({ error: { message: 'Henter maskine ID...' } });
      return;
    }

    // Sæt state til at vi indsender
    setSubmitting(true);
    setResult(null);

    // Først: Opret maskine i backend
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

    // Dernæst: Opret selve annoncen med maskinens id
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

    // Hvis alt gik godt, vis succes og nulstil formular
    setResult({ data: listing });
    setForm(INITIAL_FORM);
    setSubmitting(false);
    // Forbered næste maskine-id
    setNextMachineId(nextMachineId + 1);
    // Naviger brugeren til oversigten
    navigate('/listings');
  }

  // Returnerer hele UI'et for oprettelse af annonce
  return (
    <section className="page">
      {/* Header med titel */}
      <header className="page__header">
        <p className="eyebrow">Opret</p>
        <h1>Ny annonce</h1>
      </header>

      {/* Grid-layout med panel */}
      <div className="panel-grid">
        <div className="panel">
          {/* Vis loading hvis maskine-id hentes */}
          {loadingMachineId && (
            <div className="callout">Henter næste maskine ID...</div>
          )}
          
          {/* Formular til oprettelse af annonce */}
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

            {/* Knap til at indsende formularen */}
            <button className="button" type="submit" disabled={!hasRequiredFields || submitting || loadingMachineId}>
              {submitting ? 'Opretter...' : 'Opret annonce'}
            </button>
          </form>

          {/* Vis fejlbesked hvis der er fejl */}
          {result?.error ? (
            <div className="callout callout--warning">
              <strong>Fejl:</strong> {result.error.message}
              {result.error.status ? ` (HTTP ${result.error.status})` : ''}
              {result.error.details ? (
                <pre style={{ whiteSpace: 'pre-wrap', color: 'crimson', marginTop: 8 }}>{JSON.stringify(result.error.details, null, 2)}</pre>
              ) : null}
            </div>
          ) : null}

          {/* Vis succesbesked hvis annonce blev oprettet */}
          {result?.data ? <div className="callout">Annonce oprettet.</div> : null}
        </div>
      </div>
    </section>
  );
}

// Eksporterer komponenten så den kan bruges i routeren
export default ListingNewPage;
