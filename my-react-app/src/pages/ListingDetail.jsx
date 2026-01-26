// Importerer useEffect og useState fra React, så vi kan lave state-variabler og sideeffekter
import { useEffect, useState } from 'react';
// Importerer useParams fra React Router, så vi kan læse id fra URL'en
import { useParams } from 'react-router-dom';
// Importerer API-funktioner til at hente, oprette og læse bruger-id
import { createResource, getResource, getStoredUserId } from '../api/client';
// Importerer komponenter til anmeldelser
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';

// Komponent der viser detaljer for en enkelt annonce (listing)
function ListingDetailPage() {
  // State til at holde data for annoncen
  const [listing, setListing] = useState(null);
  // State til at holde status for indlæsning (idle, loading, success, error)
  const [status, setStatus] = useState('idle');
  // State til fejlbesked hvis noget går galt
  const [error, setError] = useState(null);
  // State til at holde valgt tidspunkt for booking
  const [bookingPeriod, setBookingPeriod] = useState('');
  // State til at holde status for booking (fx fejl eller succes)
  const [bookingStatus, setBookingStatus] = useState(null);
  // State til at holde om vi er i gang med at indsende booking
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  // id: Annonce-id fra URL'en (læses fra URL-parametre)
  const { id } = useParams();

  // useEffect kører når komponenten vises eller id ændrer sig
  useEffect(() => {
    // Opretter en AbortController så vi kan afbryde API-kald hvis brugeren forlader siden
    const controller = new AbortController();

    // Funktion der henter annonce-data fra API'et
    async function loadListing() {
      if (!id) return; // Hvis intet id, gør intet
      setStatus('loading'); // Sæt status til loading
      setError(null);       // Nulstil fejl

      // Hent annonce fra API
      const { data, error: requestError } = await getResource('Listing', id, controller.signal);
      if (requestError) {
        if (requestError.aborted) {
          setStatus('idle'); // Hvis afbrudt, sæt status til idle
          return;
        }
        setError(requestError); // Gem fejl
        setStatus('error');     // Sæt status til error
        return;
      }

      // Nogle gange kan id være i formatet "123:...", så vi splitter og tager kun tallet
      if (data && data.id) {
        data.id = parseInt(String(data.id).split(':')[0]);
      }

      setListing(data);    // Gem annonce-data
      setStatus('success'); // Sæt status til success
    }

    loadListing(); // Kald funktionen
    // Når komponenten unmountes, afbryd evt. igangværende API-kald
    return () => controller.abort();
  }, [id]);

  // Udtrækker relevante felter fra listing-objektet, med fallback til forskellige navne
  const title = listing?.title || listing?.Title || `Annonce #${id}`; // Titel på annoncen
  const description = listing?.description || listing?.Description || ''; // Beskrivelse
  const price = listing?.price ?? listing?.Price ?? null; // Pris
  const location = listing?.location || listing?.Location || '—'; // Sted
  // Maskine-id kan hedde mange ting, så vi prøver alle muligheder
  const machineId =
    listing?.machineId ??
    listing?.MachineId ??
    listing?.machineID ??
    listing?.MachineID ??
    null;

  // Hent bruger-id for den aktuelle bruger (hvis logget ind)
  const userId = getStoredUserId();

  // Konverterer en dato til ISO-format (fx "2026-01-25T12:00:00.000Z")
  function toIsoString(value) {
    // Hvis ingen værdi er valgt, returner null
    if (!value) return null;
    // Opretter et Date-objekt ud fra input
    const date = new Date(value);
    // Hvis datoen ikke er gyldig, returner null
    if (Number.isNaN(date.getTime())) return null;
    // Returnerer datoen i ISO-format (bruges til API)
    return date.toISOString();
  }

  // Funktion der håndterer booking af maskinen, når brugeren indsender formularen
  async function handleBooking(event) {
    // Forhindrer at siden genindlæses
    event.preventDefault();
    // Nulstiller status for booking (fjerner gamle fejl/succes)
    setBookingStatus(null);

    // Hvis brugeren ikke er logget ind, vis fejlbesked
    if (!userId) {
      setBookingStatus({ error: { message: 'Log ind for at booke en maskine.' } });
      return;
    }

    // Hvis maskine-id mangler, vis fejlbesked
    if (!machineId) {
      setBookingStatus({ error: { message: 'Kan ikke finde maskine id på annoncen.' } });
      return;
    }

    // Konverterer det valgte tidspunkt til ISO-format
    const periodIso = toIsoString(bookingPeriod);
    if (!periodIso) {
      setBookingStatus({ error: { message: 'Vælg et gyldigt tidspunkt.' } });
      return;
    }

    // Sætter state så vi viser loading mens vi booker
    setBookingSubmitting(true);

    // Bygger payload-objektet til API-kaldet
    const payload = {
      id: 0, // id sættes til 0, da det oprettes af serveren
      rentedByUserId: userId, // Den bruger der booker
      bookedMachineId: machineId, // Maskinen der bookes
      period: periodIso, // Tidsperiode i ISO-format
      status: true, // Booking er aktiv
    };

    // Kalder API'et for at oprette en booking
    const { data, error: bookingError } = await createResource('Booking', payload);
    if (bookingError) {
      // Hvis der opstod fejl, gem fejlbesked og fjern loading
      setBookingStatus({ error: bookingError });
      setBookingSubmitting(false);
      return;
    }

    // Hvis alt gik godt, gem succes og fjern loading
    setBookingStatus({ data });
    setBookingSubmitting(false);
  }

  // Returnerer hele UI'et for annoncesiden
  return (
    <section className="page">
      {/* Header med titel */}
      <header className="page__header">
        <p className="eyebrow">Annonce</p> {/* Lidt tekst over titlen */}
        <h1>{title}</h1> {/* Hovedtitel */}
      </header>

      {/* Viser loading eller fejl hvis nødvendigt */}
      {status === 'loading' && <p className="callout">Henter annonce...</p>}
      {error && (
        <div className="callout callout--warning">
          <strong>Fejl:</strong> {error.message}
          {error.status ? ` (HTTP ${error.status})` : ''}
        </div>
      )}

      {/* Hvis vi har annonce-data, vis detaljer */}
      {listing && (
        <>
          {/* Panel med annonce-info */}
          <div className="panel">
            <div className="listing-meta">
              <div>
                <p className="meta-label">Pris</p>
                <p className="meta-value pill pill--muted">
                  {price ? `${Number(price).toLocaleString()} kr.` : '—'}
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

            {/* Vis beskrivelse hvis den findes */}
            {description ? <p className="muted">{description}</p> : null}
          </div>

          {/* Formular til at booke maskinen */}
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
                onChange={(event) => setBookingPeriod(event.target.value)} // Opdater state når brugeren vælger tidspunkt
              />
            </label>

            {/* Vis fejl hvis der er fejl ved booking */}
            {bookingStatus?.error ? (
              <div className="callout callout--warning">
                <strong>Fejl:</strong> {bookingStatus.error.message}
                {bookingStatus.error.status ? ` (HTTP ${bookingStatus.error.status})` : ''}
              </div>
            ) : null}

            {/* Vis succesbesked hvis booking lykkedes */}
            {bookingStatus?.data ? (
              <div className="callout">Booking oprettet.</div>
            ) : null}

            {/* Knap til at indsende booking */}
            <button className="button" type="submit" disabled={bookingSubmitting}>
              {bookingSubmitting ? 'Booker...' : 'Book maskine'}
            </button>
          </form>

          {/* Reviews Section */}
          {/* Vis liste af anmeldelser for denne annonce */}
          <ReviewList listingId={Number(listing.id)} />
          
          {/* Hvis brugeren er logget ind, vis formular til at skrive anmeldelse */}
          {userId && (
            <ReviewForm 
              listingId={Number(listing.id)} 
              userId={userId}
            />
          )}
        </>
      )}
    </section>
  );
}

export default ListingDetailPage;
