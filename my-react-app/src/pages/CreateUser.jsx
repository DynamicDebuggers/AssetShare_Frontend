import { useState } from 'react';
import { createResource } from '../api/client';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  roles: [],
  roleSelect: '',
};

const ROLE_OPTIONS = ['Lejer', 'Udlejer'];

function buildPayload(form) {
  return Object.entries({
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    password: form.password,
    roles: form.roles.length ? form.roles : undefined,
  }).reduce((payload, [key, value]) => {
    if (value !== undefined && value !== '') {
      payload[key] = value;
    }
    return payload;
  }, {});
}

function CreateUserPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const hasRequiredFields = Boolean(
    form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.password
  );

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  function handleAddRole(event) {
    event.preventDefault();
    const nextRole = form.roleSelect;
    if (!nextRole || form.roles.includes(nextRole)) return;
    setForm((prev) => ({ ...prev, roles: [...prev.roles, nextRole], roleSelect: '' }));
  }

  function handleRemoveRole(roleToRemove) {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.filter((role) => role !== roleToRemove),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = buildPayload(form);

    if (!hasRequiredFields) {
      setResult({ error: { message: 'Fornavn, efternavn, e-mail og adgangskode er paakraevet.' } });
      return;
    }

    setSubmitting(true);
    setResult(null);

    const { data, error } = await createResource('User', payload);
    if (error) {
      setResult({ error });
      setSubmitting(false);
      return;
    }

    setResult({ data });
    setForm(INITIAL_FORM);
    setSubmitting(false);
  }

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Opret bruger</p>
        <h1>Opret en ny bruger</h1>
      </header>

      <div className="panel-grid">
        <div className="panel">
          <form className="field" onSubmit={handleSubmit}>
            <label className="field">
              <span>Fornavn</span>
              <input
                type="text"
                value={form.firstName}
                onChange={updateField('firstName')}
                autoComplete="given-name"
              />
            </label>
            <label className="field">
              <span>Efternavn</span>
              <input
                type="text"
                value={form.lastName}
                onChange={updateField('lastName')}
                autoComplete="family-name"
              />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                value={form.email}
                onChange={updateField('email')}
                autoComplete="email"
              />
            </label>
            <label className="field">
              <span>Rolle</span>
              <div className="field">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                  <select value={form.roleSelect} onChange={updateField('roleSelect')}>
                    <option value="">Vælg rolle</option>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button className="button" type="button" onClick={handleAddRole}>
                    Tilføj
                  </button>
                </div>
                {form.roles.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {form.roles.map((role) => (
                      <span key={role} className="pill">
                        {role}
                        <button
                          type="button"
                          style={{
                            marginLeft: '0.4rem',
                            border: 'none',
                            background: 'transparent',
                            color: '#0b0b0b',
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                          aria-label={`Fjern ${role}`}
                          onClick={() => handleRemoveRole(role)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </label>
            <label className="field">
              <span>Adgangskode</span>
              <input
                type="password"
                value={form.password}
                onChange={updateField('password')}
                autoComplete="new-password"
              />
            </label>

            <button className="button" type="submit" disabled={!hasRequiredFields || submitting}>
              {submitting ? 'Opretter.' : 'Opret bruger'}
            </button>
          </form>

          {result?.error ? (
            <div className="callout callout--warning">
              <strong>Fejl:</strong> {result.error.message}
              {result.error.status ? ` (HTTP ${result.error.status})` : ''}
            </div>
          ) : null}

          {result?.data ? <div className="callout">Bruger oprettet.</div> : null}
        </div>
      </div>
    </section>
  );
}

export default CreateUserPage;
