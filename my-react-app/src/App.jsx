import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './App.css';

const AUTH_STORAGE_KEY = 'assetshare_isLoggedIn';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    setLoggedIn(stored === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, String(loggedIn));
  }, [loggedIn]);

  function handleAuthClick() {
    setLoggedIn((prev) => !prev);
  }

  const authLabel = loggedIn ? 'Profil' : 'Opret bruger';
  const authHelper = loggedIn ? 'Se eller opdater din profil' : 'Opret en konto og kom i gang';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__dot" />
          <span>AssetShare</span>
        </div>
        <nav className="nav">
          <NavLink className={({ isActive }) => `nav__link${isActive ? ' active' : ''}`} to="/">
            Forside
          </NavLink>
        </nav>

        <div className="auth-card">
          <div className="auth-card__text">
            <strong>{authLabel}</strong>
            <span className="muted">{authHelper}</span>
          </div>
          <button className="button" onClick={handleAuthClick}>
            {loggedIn ? 'Skift bruger (log ud)' : 'Opret bruger'}
          </button>
        </div>
      </aside>

      <div className="main-area">
        <main className="content">
          <Outlet />
        </main>

        <footer className="footer">
          <span>AssetShare API Konsol</span>
          <span>Drevet af Vite + React</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
