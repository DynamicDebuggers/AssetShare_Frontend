import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  clearStoredToken,
  deleteResource,
  getResource,
  getStoredUserId,
  listResource,
  updateResource,
} from '../api/client';

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

function formatBookingPeriod(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function formatBookingStatus(value) {
  if (typeof value === 'boolean') return value ? 'Aktiv' : 'Afsluttet';
  if (typeof value === 'number') return value ? 'Aktiv' : 'Afsluttet';
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    if (!normalized) return '-';
    if (['true', 'active', 'open', 'booked', 'confirmed'].includes(normalized)) return 'Aktiv';
    if (['false', 'closed', 'ended', 'inactive', 'cancelled', 'canceled'].includes(normalized))
      return 'Afsluttet';
    return value;
  }
  return '-';
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
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingStatus, setBookingStatus] = useState('idle');
  const [bookingError, setBookingError] = useState(null);
  const navigate = useNavigate();

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
    }

    loadProfile();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();

    async function loadBookings() {
      setBookingStatus('loading');
      setBookingError(null);

      const { data, error: requestError } = await listResource('Booking', controller.signal);
      if (requestError) {
        if (requestError.aborted) {
          setBookingStatus('idle');
          return;
        }
        setBookingError(requestError);
        setBookings([]);
        setBookingStatus('error');
        return;
      }

      const allBookings = Array.isArray(data) ? data : [];
      const filtered = allBookings.filter((booking) => {
        const bookingUserId =
          booking?.rentedByUserId ??
          booking?.RentedByUserId ??
          booking?.userId ??
          booking?.UserId ??
          booking?.renterId ??
          booking?.RenterId ??
          null;
        if (bookingUserId === null || bookingUserId === undefined) return false;
        return Number(bookingUserId) === Number(userId);
      });

      setBookings(filtered);
      setBookingStatus('success');
    }

    loadBookings();
    return () => controller.abort();
  }, [userId]);

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  function handleToggleEdit() {
    setEditing((prev) => !prev);
    setSaveError(null);
    setDeleteError(null);
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

  async function handleDelete() {
    if (!userId || deleting) return;
    const confirmed = confirm('Er du sikker paa, at du vil slette din profil?');
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);

    const { error: deleteRequestError } = await deleteResource('User', userId);
    if (deleteRequestError) {
      setDeleteError(deleteRequestError);
      setDeleting(false);
      return;
    }

    clearStoredToken();
    navigate('/');
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
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="button button--secondary" onClick={handleToggleEdit}>
                {editing ? 'Annuller' : 'Rediger profil'}
              </button>
              <button className="button button--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Sletter...' : 'Slet profil'}
              </button>
            </div>
            {deleteError ? (
              <div className="callout callout--warning" style={{ marginTop: '0.75rem' }}>
                <strong>Fejl:</strong> {deleteError.message}
                {deleteError.status ? ` (HTTP ${deleteError.status})` : ''}
              </div>
          ) : null}
        </div>

        <div className="panel">
          <div className="panel__header">
            <strong>Dine bookinger</strong>
          </div>

          {bookingStatus === 'loading' && <p className="muted">Henter bookinger...</p>}
          {bookingError ? (
            <div className="callout callout--warning">
              <strong>Fejl:</strong> {bookingError.message}
              {bookingError.status ? ` (HTTP ${bookingError.status})` : ''}
            </div>
          ) : null}

          {bookingStatus === 'success' && bookings.length === 0 ? (
            <p className="muted">Ingen bookinger fundet.</p>
          ) : null}

          {bookings.length > 0 ? (
            <div className="table table--bookings">
              <div className="table__head">
                <span>Periode</span>
                <span>Maskine</span>
                <span>Status</span>
              </div>
              <div className="table__body">
                {bookings.map((booking, index) => {
                  const period =
                    booking?.period ??
                    booking?.Period ??
                    booking?.startDate ??
                    booking?.StartDate ??
                    booking?.startTime ??
                    booking?.StartTime ??
                    null;
                  const machine =
                    booking?.bookedMachineId ??
                    booking?.BookedMachineId ??
                    booking?.bookedMachineID ??
                    booking?.machineId ??
                    booking?.MachineId ??
                    booking?.MachineID ??
                    null;
                  const statusValue =
                    booking?.status ??
                    booking?.Status ??
                    booking?.isActive ??
                    booking?.active ??
                    null;
                  const bookingKey =
                    booking?.id ??
                    booking?.bookingId ??
                    booking?.BookingId ??
                    `${machine ?? 'booking'}-${index}`;

                  return (
                    <div className="table__row" key={bookingKey}>
                      <span>{formatBookingPeriod(period)}</span>
                      <span>{machine ?? '-'}</span>
                      <span className="pill">{formatBookingStatus(statusValue)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

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
