import { useEffect, useState } from 'react';
import { getResource, getStoredUserId, updateResource, listResource } from '../api/client';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
};

function buildPayload(form, profile, fallbackUserId) {
  return {
    id: profile?.id ?? fallbackUserId,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    roles: Array.isArray(profile?.roles) ? profile.roles : [],
    passwordHash: profile?.passwordHash || '',
  };
}

function mapFormFromProfile(profile) {
  return {
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
  };
}

function UserPage() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [myMachines, setMyMachines] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      setStatus('loading');
      setError(null);

      const currentUserId = getStoredUserId();
      if (!currentUserId) {
        setError({ message: 'Kunne ikke finde bruger id. Log ind igen.' });
        setStatus('error');
        return;
      }

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

      const mergedProfile = {
        ...user,
        email: user?.email || '',
        roles: user?.roles || [],
      };

      setUserId(currentUserId);
      setProfile(mergedProfile);
      setForm(mapFormFromProfile(mergedProfile));
      setStatus('success');

      // Hent brugerens maskiner
      const { data: machines } = await listResource('machine');
      if (machines && Array.isArray(machines)) {
        setMyMachines(machines.filter(m => m.userId === currentUserId));
      }
    }

    loadProfile();
    return () => controller.abort();
  }, []);

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  function handleToggleEdit() {
    setEditing((prev) => !prev);
    setSaveError(null);
    if (profile) {
      setForm(mapFormFromProfile(profile));
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!userId) return;

    setSaving(true);
    setSaveError(null);

    const payload = buildPayload(form, profile, userId);
    const { data, error: updateError } = await updateResource('User', userId, payload);
    if (updateError) {
      setSaveError(updateError);
      setSaving(false);
      return;
    }

    setProfile((prev) => ({ ...prev, ...(data && typeof data === 'object' ? data : payload) }));
    setEditing(false);
    setSaving(false);
  }

  return (
    <section className="page">
      <header className="page__header">
        <h1>Brugerprofil</h1>
      </header>

      {status === 'loading' && <p className="callout">Henter profil...</p>}
      {error ? (
        <div className="callout callout--warning">
          <strong>Fejl:</strong> {error.message}
          {error.status ? ` (HTTP ${error.status})` : ''}
        </div>
      ) : null}

      {profile ? (
        <>
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

              {saveError ? (
                <div className="callout callout--warning">
                  <strong>Fejl:</strong> {saveError.message}
                  {saveError.status ? ` (HTTP ${saveError.status})` : ''}
                </div>
              ) : null}

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


// Mads Refaktorering

// Hvad jeg skal undersøge:
// - Hvad gør de importerede klasser?
// - Hvorfor sætter man konstanter?
// - Hvad gør hver funktion?
// - Hvad gør den returnerede side?