// Importer React hooks til state og sideeffekter
import { useEffect, useState } from 'react';
// Importer API-funktioner til at hente, opdatere og liste brugere og maskiner
import { getResource, getStoredUserId, updateResource, listResource } from '../api/client';

// Startværdier for formularen
const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
};

// Bygger et payload-objekt til at opdatere brugeren
function buildPayload(form, profile, fallbackUserId) {
  return {
    id: profile?.id ?? fallbackUserId, // Brug id fra profil eller fallback
    firstName: form.firstName.trim(), // Fjern mellemrum
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    roles: Array.isArray(profile?.roles) ? profile.roles : [], // Roller hvis de findes
    passwordHash: profile?.passwordHash || '', // Medtag passwordHash hvis den findes
  };
}

// Mapper profil-data til formularfelter
function mapFormFromProfile(profile) {
  return {
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
  };
}

// Komponent der viser og redigerer brugerens profil
function UserPage() {
  // status: Status for indlæsning (idle, loading, success, error)
  const [status, setStatus] = useState('idle');
  // error: Fejlbesked hvis noget går galt
  const [error, setError] = useState(null);
  // profile: Gemmer brugerens profiloplysninger
  const [profile, setProfile] = useState(null);
  // userId: Gemmer brugerens id
  const [userId, setUserId] = useState(null);
  // editing: Om brugeren er i redigeringstilstand
  const [editing, setEditing] = useState(false);
  // form: Gemmer felter til redigering
  const [form, setForm] = useState(INITIAL_FORM);
  // saving: Om vi er i gang med at gemme ændringer
  const [saving, setSaving] = useState(false);
  // saveError: Fejlbesked ved gem
  const [saveError, setSaveError] = useState(null);
  // myMachines: Liste over brugerens maskiner
  const [myMachines, setMyMachines] = useState([]);

  // useEffect kører når komponenten vises første gang
  useEffect(() => {
    const controller = new AbortController();

    // Funktion der henter brugerens profil og maskiner
    async function loadProfile() {
      setStatus('loading'); // Vis loading
      setError(null);       // Nulstil fejl

      const currentUserId = getStoredUserId(); // Hent bruger-id
      if (!currentUserId) {
        setError({ message: 'Kunne ikke finde bruger id. Log ind igen.' });
        setStatus('error');
        return;
      }

      // Hent brugerprofil fra API
      const { data: user, error: userError } = await getResource(
        'User',
        currentUserId,
        controller.signal
      );
      if (userError) {
        if (!userError.aborted) {
          setError(userError);
          setStatus('error');
        }
        return;
      }

      // Saml profil-data og sæt defaults
      const mergedProfile = {
        ...user,
        email: user?.email || '',
        roles: user?.roles || [],
      };

      setUserId(currentUserId);
      setProfile(mergedProfile);
      setForm(mapFormFromProfile(mergedProfile));
      setStatus('success');

      // Hent alle maskiner og filtrer dem der tilhører brugeren
      const { data: machines } = await listResource('machine');
      if (machines && Array.isArray(machines)) {
        setMyMachines(machines.filter(m => m.userId === currentUserId));
      }
    }

    loadProfile();
    return () => controller.abort(); // Afbryd hvis komponenten unmountes
  }, []);

  // Funktion der opdaterer et felt i formularen
  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  // Skift mellem visning og redigering af profil
  function handleToggleEdit() {
    setEditing((prev) => !prev);
    setSaveError(null);
    if (profile) {
      setForm(mapFormFromProfile(profile));
    }
  }

  // Funktion der gemmer ændringer til profilen
  async function handleSave(event) {
    event.preventDefault(); // Forhindrer side reload
    if (!userId) return;

    setSaving(true); // Vis loading
    setSaveError(null); // Nulstil fejl

    // Byg payload og kald API for at opdatere bruger
    const payload = buildPayload(form, profile, userId);
    const { data, error: updateError } = await updateResource('User', userId, payload);
    if (updateError) {
      setSaveError(updateError); // Gem fejl
      setSaving(false);
      return;
    }

    setProfile((prev) => ({ ...prev, ...(data && typeof data === 'object' ? data : payload) })); // Opdater profil
    setEditing(false); // Gå tilbage til visning
    setSaving(false); // Fjern loading
  }

  // Returnerer hele UI'et for brugersiden
  return (
    <section className="page">
      {/* Header med titel */}
      <header className="page__header">
        <h1>Brugerprofil</h1>
      </header>

      {/* Vis loading eller fejl hvis nødvendigt */}
      {status === 'loading' && <p className="callout">Henter profil...</p>}
      {error ? (
        <div className="callout callout--warning">
          <strong>Fejl:</strong> {error.message}
          {error.status ? ` (HTTP ${error.status})` : ''}
        </div>
      ) : null}

      {/* Hvis vi har profil-data, vis detaljer */}
      {profile ? (
        <>
          {/* Panel med profil-info */}
          <div className="panel">
            <div className="panel__header">
              <strong>
                {profile.firstName || '-'} {profile.lastName || ''}
              </strong>
            </div>
            <div className="listing-meta">
              <div>
                <p className="meta-label">E-mail</p>
                <p className="meta-value">{profile.email || '-'}</p>
              </div>
              <div>
                <p className="meta-label">Roller</p>
                <p className="meta-value">
                  {profile.roles && profile.roles.length > 0 ? profile.roles.join(', ') : '-'}
                </p>
              </div>
            </div>
            <button className="button button--secondary" onClick={handleToggleEdit}>
              {editing ? 'Annuller' : 'Rediger profil'}
            </button>
          </div>

          {/* Mine maskiner */}
          {myMachines.length > 0 && (
            <div className="panel">
              <div className="panel__header"><strong>Mine maskiner</strong></div>
              <ul>
                {myMachines.map(m => (
                  <li key={m.id}>
                    {m.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Formular til at redigere profil */}
          {editing ? (
            <form className="panel field" onSubmit={handleSave}>
              <label className="field">
                <span>Fornavn</span>
                <input type="text" value={form.firstName} onChange={updateField('firstName')} />
              </label>
              <label className="field">
                <span>Efternavn</span>
                <input type="text" value={form.lastName} onChange={updateField('lastName')} />
              </label>
              <label className="field">
                <span>E-mail</span>
                <input type="email" value={form.email} onChange={updateField('email')} />
              </label>

              {/* Vis fejl hvis der er fejl ved gem */}
              {saveError ? (
                <div className="callout callout--warning">
                  <strong>Fejl:</strong> {saveError.message}
                  {saveError.status ? ` (HTTP ${saveError.status})` : ''}
                </div>
              ) : null}

              {/* Knap til at gemme ændringer */}
              <button className="button" type="submit" disabled={saving}>
                {saving ? 'Gemmer...' : 'Gem ændringer'}
              </button>
            </form>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export default UserPage;
