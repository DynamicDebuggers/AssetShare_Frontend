import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../api/client';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

function buildRegisterPayload(form) {
  return Object.entries({
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    password: form.password,
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

  async function handleSubmit(event) {
    event.preventDefault();

    if (!hasRequiredFields) {
      setResult({
        error: {
          message: 'Fornavn, efternavn, e-mail og adgangskode er paakraevet.',
        },
      });
      return;
    }

    setSubmitting(true);
    setResult(null);

    const { data, error } = await registerUser(buildRegisterPayload(form));
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

          <p className="muted" style={{ marginTop: '0.75rem' }}>
            <Link to="/login">Er du allerede bruger?</Link>
          </p>

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


// Mads Refaktorering

// Hvad jeg skal undersøge:
// - Hvad gør de importerede ressourcer?
// - Hvad gør const INITIAL_FORM?
// - Hvad gør funktionerne?
// - Hvorfor returnerer man siden?
