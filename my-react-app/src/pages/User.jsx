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

function isStatusActive(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    if (!normalized) return false;
    return ['true', 'active', 'open', 'booked', 'confirmed', 'yes', 'ja'].includes(normalized);
  }
  return false;
}

function toLocalInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoString(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') return '-';
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return String(value);
  return `${numberValue.toLocaleString()} kr.`;
}

function getListingId(listing) {
  return listing?.id ?? listing?.listingId ?? listing?.ListingId ?? listing?.ID ?? null;
}

function getBookingId(booking) {
  return booking?.id ?? booking?.bookingId ?? booking?.BookingId ?? booking?.ID ?? null;
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
  const [bookingEditingId, setBookingEditingId] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    period: '',
    status: true,
    bookedMachineId: '',
    rentedByUserId: '',
  });
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingDeletingId, setBookingDeletingId] = useState(null);
  const [bookingActionError, setBookingActionError] = useState(null);
  const [listings, setListings] = useState([]);
  const [listingStatus, setListingStatus] = useState('idle');
  const [listingError, setListingError] = useState(null);
  const [listingEditingId, setListingEditingId] = useState(null);
  const [listingForm, setListingForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
  });
  const [listingSaving, setListingSaving] = useState(false);
  const [listingDeletingId, setListingDeletingId] = useState(null);
  const [listingActionError, setListingActionError] = useState(null);
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

  function updateBookingField(field) {
    return (event) => {
      const value = field === 'status' ? event.target.checked : event.target.value;
      setBookingForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  function startBookingEdit(booking) {
    const bookingId = getBookingId(booking);
    if (!bookingId) return;
    const periodValue =
      booking?.period ??
      booking?.Period ??
      booking?.startDate ??
      booking?.StartDate ??
      booking?.startTime ??
      booking?.StartTime ??
      null;
    const machineValue =
      booking?.bookedMachineId ??
      booking?.BookedMachineId ??
      booking?.bookedMachineID ??
      booking?.machineId ??
      booking?.MachineId ??
      booking?.MachineID ??
      '';
    const renterValue =
      booking?.rentedByUserId ??
      booking?.RentedByUserId ??
      booking?.userId ??
      booking?.UserId ??
      userId ??
      '';
    const statusValue =
      booking?.status ??
      booking?.Status ??
      booking?.isActive ??
      booking?.active ??
      false;

    setBookingEditingId(bookingId);
    setBookingForm({
      period: toLocalInputValue(periodValue),
      status: isStatusActive(statusValue),
      bookedMachineId: machineValue ?? '',
      rentedByUserId: renterValue ?? '',
    });
    setBookingActionError(null);
  }

  function cancelBookingEdit() {
    setBookingEditingId(null);
    setBookingForm({
      period: '',
      status: true,
      bookedMachineId: '',
      rentedByUserId: '',
    });
    setBookingActionError(null);
  }

  async function handleBookingSave(event) {
    event.preventDefault();
    if (!bookingEditingId) return;

    const periodIso = toIsoString(bookingForm.period);
    if (!periodIso) {
      setBookingActionError({ message: 'Vaelg et gyldigt tidspunkt.' });
      return;
    }

    setBookingSaving(true);
    setBookingActionError(null);

    const payload = {
      id: bookingEditingId,
      rentedByUserId: bookingForm.rentedByUserId ? Number(bookingForm.rentedByUserId) : userId,
      bookedMachineId: bookingForm.bookedMachineId ? Number(bookingForm.bookedMachineId) : null,
      period: periodIso,
      status: Boolean(bookingForm.status),
    };

    const { data, error: updateError } = await updateResource('Booking', bookingEditingId, payload);
    if (updateError) {
      setBookingActionError(updateError);
      setBookingSaving(false);
      return;
    }

    const nextData = data && typeof data === 'object' ? data : payload;
    setBookings((prev) =>
      prev.map((booking) =>
        Number(getBookingId(booking)) === Number(bookingEditingId)
          ? { ...booking, ...nextData }
          : booking
      )
    );
    setBookingSaving(false);
    setBookingEditingId(null);
  }

  async function handleBookingDelete(bookingId) {
    if (!bookingId || bookingDeletingId) return;
    const confirmed = confirm('Er du sikker paa, at du vil slette bookingen?');
    if (!confirmed) return;

    setBookingDeletingId(bookingId);
    setBookingActionError(null);

    const { error: deleteError } = await deleteResource('Booking', bookingId);
    if (deleteError) {
      setBookingActionError(deleteError);
      setBookingDeletingId(null);
      return;
    }

    setBookings((prev) =>
      prev.filter((booking) => Number(getBookingId(booking)) !== Number(bookingId))
    );
    if (Number(bookingEditingId) === Number(bookingId)) {
      cancelBookingEdit();
    }
    setBookingDeletingId(null);
  }

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();

    async function loadListings() {
      setListingStatus('loading');
      setListingError(null);

      const { data, error: requestError } = await listResource('Listing', controller.signal);
      if (requestError) {
        if (requestError.aborted) {
          setListingStatus('idle');
          return;
        }
        setListingError(requestError);
        setListings([]);
        setListingStatus('error');
        return;
      }

      const allListings = Array.isArray(data) ? data : [];
      const filtered = allListings.filter((listing) => {
        const listingUserId =
          listing?.userId ??
          listing?.UserId ??
          listing?.ownerId ??
          listing?.OwnerId ??
          listing?.createdByUserId ??
          listing?.CreatedByUserId ??
          null;
        if (listingUserId === null || listingUserId === undefined) return false;
        return Number(listingUserId) === Number(userId);
      });

      setListings(filtered);
      setListingStatus('success');
    }

    loadListings();
    return () => controller.abort();
  }, [userId]);

  function updateListingField(field) {
    return (event) => {
      setListingForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  function startListingEdit(listing) {
    const listingId = getListingId(listing);
    if (!listingId) return;
    setListingEditingId(listingId);
    setListingForm({
      title: listing?.title || listing?.Title || '',
      description: listing?.description || listing?.Description || '',
      price: listing?.price ?? listing?.Price ?? '',
      location: listing?.location || listing?.Location || '',
    });
    setListingActionError(null);
  }

  function cancelListingEdit() {
    setListingEditingId(null);
    setListingForm({
      title: '',
      description: '',
      price: '',
      location: '',
    });
    setListingActionError(null);
  }

  async function handleListingSave(event) {
    event.preventDefault();
    if (!listingEditingId) return;
    setListingSaving(true);
    setListingActionError(null);

    const payload = {
      title: listingForm.title.trim(),
      description: listingForm.description.trim(),
      price: listingForm.price === '' ? 0 : Number(listingForm.price),
      location: listingForm.location.trim(),
    };

    const { data, error: updateError } = await updateResource('Listing', listingEditingId, payload);
    if (updateError) {
      setListingActionError(updateError);
      setListingSaving(false);
      return;
    }

    const nextData = data && typeof data === 'object' ? data : payload;
    setListings((prev) =>
      prev.map((listing) =>
        Number(getListingId(listing)) === Number(listingEditingId)
          ? { ...listing, ...nextData }
          : listing
      )
    );
    setListingSaving(false);
    setListingEditingId(null);
  }

  async function handleListingDelete(listingId) {
    if (!listingId || listingDeletingId) return;
    const confirmed = confirm('Er du sikker paa, at du vil slette annoncen?');
    if (!confirmed) return;

    setListingDeletingId(listingId);
    setListingActionError(null);

    const { error: deleteError } = await deleteResource('Listing', listingId);
    if (deleteError) {
      setListingActionError(deleteError);
      setListingDeletingId(null);
      return;
    }

    setListings((prev) =>
      prev.filter((listing) => Number(getListingId(listing)) !== Number(listingId))
    );
    if (Number(listingEditingId) === Number(listingId)) {
      cancelListingEdit();
    }
    setListingDeletingId(null);
  }

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
                <span>Handlinger</span>
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
                  const bookingId = getBookingId(booking);
                  const bookingKey = bookingId ?? `${machine ?? 'booking'}-${index}`;

                  return (
                    <div className="table__row" key={bookingKey}>
                      <span>{formatBookingPeriod(period)}</span>
                      <span>{machine ?? '-'}</span>
                      <span className="pill">{formatBookingStatus(statusValue)}</span>
                      <span>
                        {bookingId ? (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              className="button button--small"
                              type="button"
                              onClick={() => startBookingEdit(booking)}
                            >
                              Rediger
                            </button>
                            <button
                              className="button button--small button--danger"
                              type="button"
                              onClick={() => handleBookingDelete(bookingId)}
                              disabled={bookingDeletingId === bookingId}
                            >
                              {bookingDeletingId === bookingId ? 'Sletter...' : 'Slet'}
                            </button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {bookingActionError ? (
            <div className="callout callout--warning" style={{ marginTop: '0.75rem' }}>
              <strong>Fejl:</strong> {bookingActionError.message}
              {bookingActionError.status ? ` (HTTP ${bookingActionError.status})` : ''}
            </div>
          ) : null}

          {bookingEditingId ? (
            <form className="field" onSubmit={handleBookingSave} style={{ marginTop: '1rem' }}>
              <div className="form-grid">
                <label className="field">
                  <span>Periode</span>
                  <input
                    type="datetime-local"
                    value={bookingForm.period}
                    onChange={updateBookingField('period')}
                  />
                </label>
                <label className="field">
                  <span>Maskine ID</span>
                  <input
                    type="number"
                    value={bookingForm.bookedMachineId}
                    onChange={updateBookingField('bookedMachineId')}
                  />
                </label>
                <label className="field" style={{ alignItems: 'flex-start' }}>
                  <span>Aktiv</span>
                  <input
                    type="checkbox"
                    checked={Boolean(bookingForm.status)}
                    onChange={updateBookingField('status')}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button className="button" type="submit" disabled={bookingSaving}>
                  {bookingSaving ? 'Gemmer...' : 'Gem'}
                </button>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={cancelBookingEdit}
                >
                  Annuller
                </button>
              </div>
            </form>
          ) : null}
        </div>

        <div className="panel">
          <div className="panel__header">
            <strong>Dine annoncer</strong>
          </div>

          {listingStatus === 'loading' && <p className="muted">Henter annoncer...</p>}
          {listingError ? (
            <div className="callout callout--warning">
              <strong>Fejl:</strong> {listingError.message}
              {listingError.status ? ` (HTTP ${listingError.status})` : ''}
            </div>
          ) : null}

          {listingStatus === 'success' && listings.length === 0 ? (
            <p className="muted">Ingen annoncer fundet.</p>
          ) : null}

          {listings.length > 0 ? (
            <div className="table table--listings">
              <div className="table__head">
                <span>Titel</span>
                <span>Pris</span>
                <span>Sted</span>
                <span>Handlinger</span>
              </div>
              <div className="table__body">
                {listings.map((listing, index) => {
                  const listingId = getListingId(listing);
                  const listingKey = listingId ?? `${index}-${listing?.title}`;
                  const title = listing?.title || listing?.Title || 'Untitled';
                  const price = listing?.price ?? listing?.Price ?? null;
                  const location = listing?.location || listing?.Location || '-';

                  return (
                    <div className="table__row" key={listingKey}>
                      <span>{title}</span>
                      <span>{formatPrice(price)}</span>
                      <span>{location}</span>
                      <span>
                        {listingId ? (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              className="button button--small"
                              type="button"
                              onClick={() => startListingEdit(listing)}
                            >
                              Rediger
                            </button>
                            <button
                              className="button button--small button--danger"
                              type="button"
                              onClick={() => handleListingDelete(listingId)}
                              disabled={listingDeletingId === listingId}
                            >
                              {listingDeletingId === listingId ? 'Sletter...' : 'Slet'}
                            </button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {listingActionError ? (
            <div className="callout callout--warning" style={{ marginTop: '0.75rem' }}>
              <strong>Fejl:</strong> {listingActionError.message}
              {listingActionError.status ? ` (HTTP ${listingActionError.status})` : ''}
            </div>
          ) : null}

          {listingEditingId ? (
            <form className="field" onSubmit={handleListingSave} style={{ marginTop: '1rem' }}>
              <div className="form-grid">
                <label className="field">
                  <span>Titel</span>
                  <input type="text" value={listingForm.title} onChange={updateListingField('title')} />
                </label>
                <label className="field">
                  <span>Pris</span>
                  <input
                    type="number"
                    value={listingForm.price}
                    onChange={updateListingField('price')}
                  />
                </label>
                <label className="field">
                  <span>Sted</span>
                  <input
                    type="text"
                    value={listingForm.location}
                    onChange={updateListingField('location')}
                  />
                </label>
              </div>
              <label className="field" style={{ marginTop: '0.75rem' }}>
                <span>Beskrivelse</span>
                <textarea
                  rows="4"
                  value={listingForm.description}
                  onChange={updateListingField('description')}
                />
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button className="button" type="submit" disabled={listingSaving}>
                  {listingSaving ? 'Gemmer...' : 'Gem'}
                </button>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={cancelListingEdit}
                >
                  Annuller
                </button>
              </div>
            </form>
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
