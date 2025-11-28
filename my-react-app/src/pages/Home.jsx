function HomePage() {
  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Dashboard</p>
        <h1>AssetShare Frontend</h1>
        <p className="lede">
          A simple shell for browsing assets, wiring API calls, and adding new features.
          Use the navigation to explore routes.
        </p>
      </header>

      <div className="panel-grid">
        <article className="panel">
          <h2>Routing</h2>
          <p>
            Pages are controlled by the router in <code>src/router.jsx</code> using a shared
            layout, so you can drop in new pages quickly.
          </p>
        </article>

        <article className="panel">
          <h2>API client</h2>
          <p>
            Centralize network calls in <code>src/api/client.js</code>. Configure the base URL
            with <code>VITE_API_BASE_URL</code>.
          </p>
        </article>

        <article className="panel">
          <h2>Next steps</h2>
          <ul>
            <li>Hook real data into the Assets page</li>
            <li>Add authentication and protected routes</li>
            <li>Drop in design system components</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

export default HomePage;
