import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getResource } from '../api/client';

function MachineDetailPage() {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMachine() {
      if (!id) return;
      setStatus('loading');
      setError(null);

      const { data, error: requestError } = await getResource('Machine', id, controller.signal);
      if (requestError) {
        if (requestError.aborted) {
          setStatus('idle');
          return;
        }
        setError(requestError);
        setStatus('error');
        return;
      }

      setMachine(data);
      setStatus('success');
    }

    loadMachine();
    return () => controller.abort();
  }, [id]);

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Maskine</p>
        <h1>Maskinedetaljer</h1>
      </header>

      {status === 'loading' && <p className="callout">Henter maskine...</p>}
      {error && (
        <div className="callout callout--warning">
          <strong>Fejl:</strong> {error.message}
          {error.status ? ` (HTTP ${error.status})` : ''}
        </div>
      )}

      {machine && (
        <div className="panel">
          <div className="panel__header">
            <strong>{machine.name || `Maskine #${machine.id ?? id}`}</strong>
          </div>
          <div className="listing-meta">
            <div>
              <p className="meta-label">Maskine ID</p>
              <p className="meta-value">{machine.id ?? id}</p>
            </div>
            <div>
              <p className="meta-label">Status</p>
              <p className="meta-value">{machine.status || '-'}</p>
            </div>
            <div>
              <p className="meta-label">Ejer</p>
              <p className="meta-value">{machine.owner || '-'}</p>
            </div>
          </div>
          {machine.description ? <p className="muted">{machine.description}</p> : null}
        </div>
      )}
    </section>
  );
}

export default MachineDetailPage;
