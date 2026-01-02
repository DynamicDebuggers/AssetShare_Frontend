import { useState } from "react";
import {
  createResource,
  deleteResource,
  getResource,
  listResource,
  updateResource,
} from "../api/client";

function parseJson(value) {
  if (!value.trim()) return { ok: true, data: {} };
  try {
    return { ok: true, data: JSON.parse(value) };
  } catch (error) {
    return { ok: false, error: "Ugyldig JSON-body." };
  }
}

function ResultCard({ result }) {
  if (!result) return null;

  if (result.error) {
    return (
      <div className="callout callout--warning">
        <strong>{result.action} mislykkedes:</strong> {result.error.message}
        {result.error.status ? ` (HTTP ${result.error.status})` : ""}
      </div>
    );
  }

  return (
    <div className="result">
      <div className="result__title">
        <span className="tag">OK</span>
        <span>{result.action}</span>
      </div>
      <pre>{JSON.stringify(result.data, null, 2)}</pre>
    </div>
  );
}

function ResourceConsole({ resourceName, title, description }) {
  const [idInput, setIdInput] = useState("");
  const [updateIdInput, setUpdateIdInput] = useState("");
  const [payloadText, setPayloadText] = useState("{ }");
  const [result, setResult] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  const resourcePath = `/${resourceName}`;

  async function handleList() {
    setLoadingAction("list");
    const { data, error } = await listResource(resourceName);
    setResult({ action: `GET ${resourcePath}`, data, error });
    setLoadingAction(null);
  }

  async function handleGetById(e) {
    e.preventDefault();
    if (!idInput.trim()) return;
    setLoadingAction("get");
    const { data, error } = await getResource(resourceName, idInput.trim());
    setResult({ action: `GET ${resourcePath}/{id}`, data, error });
    setLoadingAction(null);
  }

  async function handleCreate(e) {
    e.preventDefault();
    const parsed = parseJson(payloadText);
    if (!parsed.ok) {
      setResult({ action: `POST ${resourcePath}`, error: { message: parsed.error } });
      return;
    }

    setLoadingAction("create");
    const { data, error } = await createResource(resourceName, parsed.data);
    setResult({ action: `POST ${resourcePath}`, data, error });
    setLoadingAction(null);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!updateIdInput.trim()) return;
    const parsed = parseJson(payloadText);
    if (!parsed.ok) {
      setResult({ action: `PUT ${resourcePath}/{id}`, error: { message: parsed.error } });
      return;
    }

    setLoadingAction("update");
    const { data, error } = await updateResource(resourceName, updateIdInput.trim(), parsed.data);
    setResult({ action: `PUT ${resourcePath}/{id}`, data, error });
    setLoadingAction(null);
  }

  async function handleDelete(e) {
    e.preventDefault();
    if (!idInput.trim()) return;
    setLoadingAction("delete");
    const { data, error } = await deleteResource(resourceName, idInput.trim());
    setResult({ action: `DELETE ${resourcePath}/{id}`, data, error });
    setLoadingAction(null);
  }

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">API-konsol</p>
        <h1>{title || resourceName}</h1>
        {description ? <p className="lede">{description}</p> : null}
        <p className="muted">
          Base-URL: <code>{resourcePath}</code> (styres via <code>VITE_API_BASE_URL</code>)
        </p>
      </header>

      <div className="form-grid">
        <div className="panel">
          <div className="panel__header">
            <span className="tag">GET</span>
            <strong>Hent alle</strong>
          </div>
          <p className="muted">GET {resourcePath}</p>
          <button className="button" onClick={handleList} disabled={loadingAction === "list"}>
            {loadingAction === "list" ? "Henter…" : "Hent"}
          </button>
        </div>

        <div className="panel">
          <div className="panel__header">
            <span className="tag">GET</span>
            <strong>Hent via id</strong>
          </div>
          <p className="muted">GET {resourcePath}/&#123;id&#125;</p>
          <form className="field" onSubmit={handleGetById}>
            <input
              type="text"
              placeholder="id"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
            />
            <button className="button" type="submit" disabled={loadingAction === "get"}>
              {loadingAction === "get" ? "Henter…" : "Hent"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel__header">
            <span className="tag tag--post">POST</span>
            <strong>Opret</strong>
          </div>
          <p className="muted">POST {resourcePath}</p>
          <form className="field" onSubmit={handleCreate}>
            <textarea
              rows="5"
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              placeholder='{"name":"value"}'
            />
            <button className="button" type="submit" disabled={loadingAction === "create"}>
              {loadingAction === "create" ? "Sender…" : "Send"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel__header">
            <span className="tag tag--put">PUT</span>
            <strong>Opdater</strong>
          </div>
          <p className="muted">PUT {resourcePath}/&#123;id&#125;</p>
          <form className="field" onSubmit={handleUpdate}>
            <input
              type="text"
              placeholder="id"
              value={updateIdInput}
              onChange={(e) => setUpdateIdInput(e.target.value)}
            />
            <textarea
              rows="5"
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              placeholder='{"name":"updated"}'
            />
            <button className="button" type="submit" disabled={loadingAction === "update"}>
              {loadingAction === "update" ? "Opdaterer…" : "Opdater"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel__header">
            <span className="tag tag--delete">DELETE</span>
            <strong>Slet</strong>
          </div>
          <p className="muted">DELETE {resourcePath}/&#123;id&#125;</p>
          <form className="field" onSubmit={handleDelete}>
            <input
              type="text"
              placeholder="id"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
            />
            <button className="button" type="submit" disabled={loadingAction === "delete"}>
              {loadingAction === "delete" ? "Sletter…" : "Slet"}
            </button>
          </form>
        </div>
      </div>

      <ResultCard result={result} />
    </section>
  );
}

export default ResourceConsole;
