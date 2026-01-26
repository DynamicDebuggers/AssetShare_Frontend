// Importerer useState fra React, så vi kan lave state-variabler
import { useState } from "react";

// Importerer alle de nødvendige API-funktioner til at lave, hente, opdatere og slette ressourcer
import {
  createResource, // Funktion til at oprette en ressource
  deleteResource, // Funktion til at slette en ressource
  getResource,    // Funktion til at hente en ressource
  listResource,   // Funktion til at hente alle ressourcer
  updateResource, // Funktion til at opdatere en ressource
} from "../api/client";

// Forsøger at parse en tekststreng som JSON
// Returnerer { ok: true, data } hvis det lykkes, ellers { ok: false, error }
function parseJson(value) {
  // Hvis feltet er tomt, returner et tomt objekt
  if (!value.trim()) return { ok: true, data: {} };
  try {
    // Prøv at parse som JSON
    return { ok: true, data: JSON.parse(value) };
  } catch (error) {
    // Hvis det fejler, returner fejl
    return { ok: false, error: "Ugyldig JSON-body." };
  }
}

// Komponent der viser resultatet af en API-operation (fx GET, POST, PUT, DELETE)
// Viser fejl hvis der er fejl, ellers viser den data
function ResultCard({ result }) {
  // Hvis der ikke er noget resultat endnu, vis intet
  if (!result) return null;

  // Hvis der er fejl, vis fejlbesked med handling og evt. statuskode
  if (result.error) {
    return (
      <div className="callout callout--warning">
        <strong>{result.action} mislykkedes:</strong> {result.error.message}
        {result.error.status ? ` (HTTP ${result.error.status})` : ""}
      </div>
    );
  }

  // Hvis der ikke er fejl, vis dataen pænt formateret
  return (
    <div className="result">
      <div className="result__title">
        <span className="tag">OK</span>
        <span>{result.action}</span>
      </div>
      {/* JSON.stringify bruges til at vise objektet pænt */}
      <pre>{JSON.stringify(result.data, null, 2)}</pre>
    </div>
  );
}

// Komponent der giver et konsol-lignende interface til at teste API'et for en ressource
// resourceName: navnet på ressourcen (fx 'User')
// title: overskrift til konsollen
// description: beskrivelse af ressourcen
function ResourceConsole({ resourceName, title, description }) {
  // State-variabel til id-inputfeltet (bruges til GET og DELETE)
  const [idInput, setIdInput] = useState("");
  // State-variabel til id-inputfeltet for opdatering (PUT)
  const [updateIdInput, setUpdateIdInput] = useState("");
  // State-variabel til tekstfeltet med JSON-body (POST/PUT)
  const [payloadText, setPayloadText] = useState("{ }");
  // State-variabel til at gemme resultatet af sidste API-kald
  const [result, setResult] = useState(null);
  // State-variabel til at holde styr på hvilken handling der er i gang (for at vise loading)
  const [loadingAction, setLoadingAction] = useState(null);

  // Bygger stien til ressourcen (fx '/User')
  const resourcePath = `/${resourceName}`;

  // Funktion der henter alle ressourcer (GET)
  async function handleList() {
    setLoadingAction("list"); // Sæt loading state
    const { data, error } = await listResource(resourceName); // Kald API
    setResult({ action: `GET ${resourcePath}`, data, error }); // Gem resultat
    setLoadingAction(null); // Fjern loading
  }

  // Funktion der henter en ressource via id (GET)
  async function handleGetById(e) {
    e.preventDefault(); // Forhindrer side reload
    if (!idInput.trim()) return; // Hvis feltet er tomt, gør intet
    setLoadingAction("get"); // Sæt loading
    const { data, error } = await getResource(resourceName, idInput.trim()); // Kald API
    setResult({ action: `GET ${resourcePath}/{id}`, data, error }); // Gem resultat
    setLoadingAction(null); // Fjern loading
  }

  // Funktion der opretter en ny ressource (POST)
  async function handleCreate(e) {
    e.preventDefault(); // Forhindrer side reload
    const parsed = parseJson(payloadText); // Prøv at parse JSON-body
    if (!parsed.ok) {
      // Hvis JSON er ugyldig, vis fejl
      setResult({ action: `POST ${resourcePath}`, error: { message: parsed.error } });
      return;
    }

    setLoadingAction("create"); // Sæt loading
    const { data, error } = await createResource(resourceName, parsed.data); // Kald API
    setResult({ action: `POST ${resourcePath}`, data, error }); // Gem resultat
    setLoadingAction(null); // Fjern loading
  }

  // Funktion der opdaterer en eksisterende ressource (PUT)
  async function handleUpdate(e) {
    e.preventDefault(); // Forhindrer side reload
    if (!updateIdInput.trim()) return; // Hvis feltet er tomt, gør intet
    const parsed = parseJson(payloadText); // Prøv at parse JSON-body
    if (!parsed.ok) {
      // Hvis JSON er ugyldig, vis fejl
      setResult({ action: `PUT ${resourcePath}/{id}`, error: { message: parsed.error } });
      return;
    }

    setLoadingAction("update"); // Sæt loading
    const { data, error } = await updateResource(resourceName, updateIdInput.trim(), parsed.data); // Kald API
    setResult({ action: `PUT ${resourcePath}/{id}`, data, error }); // Gem resultat
    setLoadingAction(null); // Fjern loading
  }

  // Funktion der sletter en ressource via id (DELETE)
  async function handleDelete(e) {
    e.preventDefault(); // Forhindrer side reload
    if (!idInput.trim()) return; // Hvis feltet er tomt, gør intet
    setLoadingAction("delete"); // Sæt loading
    const { data, error } = await deleteResource(resourceName, idInput.trim()); // Kald API
    setResult({ action: `DELETE ${resourcePath}/{id}`, data, error }); // Gem resultat
    setLoadingAction(null); // Fjern loading
  }

  // Returnerer hele UI'et for API-konsollen
  return (
    <section className="page">
      {/* Header med titel og beskrivelse */}
      <header className="page__header">
        <p className="eyebrow">API-konsol</p> {/* Lidt tekst over titlen */}
        <h1>{title || resourceName}</h1> {/* Hovedtitel */}
        {description ? <p className="lede">{description}</p> : null} {/* Beskrivelse hvis den findes */}
        <p className="muted">
          Base-URL: <code>{resourcePath}</code> (styres via <code>VITE_API_BASE_URL</code>)
        </p>
      </header>

      {/* Paneler til de forskellige CRUD-operationer */}
      <div className="form-grid">
        {/* Panel til at hente alle ressourcer */}
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

        {/* Panel til at hente en ressource via id */}
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
              onChange={(e) => setIdInput(e.target.value)} // Opdater state når brugeren skriver
            />
            <button className="button" type="submit" disabled={loadingAction === "get"}>
              {loadingAction === "get" ? "Henter…" : "Hent"}
            </button>
          </form>
        </div>

        {/* Panel til at oprette en ressource */}
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
              onChange={(e) => setPayloadText(e.target.value)} // Opdater state når brugeren skriver
              placeholder='{"name":"value"}'
            />
            <button className="button" type="submit" disabled={loadingAction === "create"}>
              {loadingAction === "create" ? "Sender…" : "Send"}
            </button>
          </form>
        </div>

        {/* Panel til at opdatere en ressource */}
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
              onChange={(e) => setUpdateIdInput(e.target.value)} // Opdater state når brugeren skriver
            />
            <textarea
              rows="5"
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)} // Opdater state når brugeren skriver
              placeholder='{"name":"updated"}'
            />
            <button className="button" type="submit" disabled={loadingAction === "update"}>
              {loadingAction === "update" ? "Opdaterer…" : "Opdater"}
            </button>
          </form>
        </div>

        {/* Panel til at slette en ressource */}
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
              onChange={(e) => setIdInput(e.target.value)} // Opdater state når brugeren skriver
            />
            <button className="button" type="submit" disabled={loadingAction === "delete"}>
              {loadingAction === "delete" ? "Sletter…" : "Slet"}
            </button>
          </form>
        </div>
      </div>

      {/* Viser resultatet af sidste handling */}
      <ResultCard result={result} />
    </section>
  );
}

// Eksporterer komponenten så den kan bruges i andre filer
export default ResourceConsole;
