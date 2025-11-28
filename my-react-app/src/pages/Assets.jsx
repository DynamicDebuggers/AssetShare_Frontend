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
          This route pulls asset data from the API client. Configure <code>VITE_API_BASE_URL</code> to
          point at your backend.
        </p>
      </header>

      {status === "loading" && <p className="callout">Loading assets…</p>}
      {error && (
        <p className="callout callout--warning">
          {error.message}
          {error.status ? ` (HTTP ${error.status})` : ""}.
        </p>
      )}

      <div className="table">
        <div className="table__head">
          <span>ID</span>
          <span>Name</span>
          <span>Owner</span>
          <span>Status</span>
        </div>
        <div className="table__body">
          {assets.length === 0 && (
            <div className="table__row table__row--muted">No assets found.</div>
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
