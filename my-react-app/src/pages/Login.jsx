import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/client';

const INITIAL_FORM = {
  email: '',
  password: '',
};

function LoginPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const hasRequiredFields = Boolean(form.email.trim() && form.password);

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!hasRequiredFields) {
      setResult({ error: { message: 'E-mail og adgangskode er paakraevet.' } });
      return;
    }

    setSubmitting(true);
    setResult(null);

    const { data, error } = await loginUser({
      email: form.email.trim(),
      password: form.password,
    });
    if (error) {
      setResult({ error });
      setSubmitting(false);
      return;
    }

    setResult({ data });
    setForm({ ...INITIAL_FORM, email: form.email.trim() });
    setSubmitting(false);
    navigate('/');
  }

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Log ind</p>
        <h1>Log ind på din konto</h1>
      </header>

      <div className="panel-grid">
        <div className="panel">
          <form className="field" onSubmit={handleSubmit}>
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
                autoComplete="current-password"
              />
            </label>

            <button className="button" type="submit" disabled={!hasRequiredFields || submitting}>
              {submitting ? 'Logger ind.' : 'Log ind'}
            </button>
          </form>

          <p className="muted" style={{ marginTop: '0.75rem' }}>
            <Link to="/opret-bruger">Har du ikke en bruger?</Link>
          </p>

          {result?.error ? (
            <div className="callout callout--warning">
              <strong>Fejl:</strong> {result.error.message}
              {result.error.status ? ` (HTTP ${result.error.status})` : ''}
            </div>
          ) : null}

          {result?.data ? null : null}
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
