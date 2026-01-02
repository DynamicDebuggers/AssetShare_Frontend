import { useEffect, useState } from "react";
import { listAssets } from "../api/client";

function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAssets() {
      setStatus("loading");
      const { data, error: requestError } = await listAssets(controller.signal);

      if (requestError) {
        setError(requestError);
        setAssets([]);
        setStatus("error");
        return;
      }

      setAssets(Array.isArray(data) ? data : []);
      setStatus("success");
    }

    loadAssets();
    return () => controller.abort();
  }, []);

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Data</p>
        <h1>Assets</h1>
        <p className="lede">
          Denne rute henter asset-data fra API-klienten. Angiv <code>VITE_API_BASE_URL</code> til din
          backend.
        </p>
      </header>

      {status === "loading" && <p className="callout">Henter assets…</p>}
      {error && (
        <p className="callout callout--warning">
          {error.message}
          {error.status ? ` (HTTP ${error.status})` : ""}.
        </p>
      )}

      <div className="table">
        <div className="table__head">
          <span>ID</span>
          <span>Navn</span>
          <span>Ejer</span>
          <span>Status</span>
        </div>
        <div className="table__body">
          {assets.length === 0 && (
            <div className="table__row table__row--muted">Ingen assets fundet.</div>
          )}
          {assets.map((asset) => (
            <div className="table__row" key={asset.id}>
              <span>{asset.id}</span>
              <span>{asset.name}</span>
              <span>{asset.owner}</span>
              <span className="pill">{asset.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AssetsPage;
