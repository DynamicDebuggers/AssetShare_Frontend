import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './App.css';

const AUTH_STORAGE_KEY = 'assetshare_isLoggedIn';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    setLoggedIn(stored === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, String(loggedIn));
  }, [loggedIn]);

  function handleLogin() {
    setLoggedIn(true);
  }

  function handleLogout() {
    setLoggedIn(false);
  }

  function handleCreateUser() {
    navigate('/opret-bruger');
  }

  const authLabel = loggedIn ? 'Profil' : 'Log ind eller opret';
  const authHelper = loggedIn
    ? 'Du er logget ind. Se eller opdater din profil.'
    : 'Log ind hvis du har en konto, eller opret en bruger hvis du er ny.';

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
          <div className="auth-card__actions">
            <button className="button" onClick={loggedIn ? handleLogout : handleLogin}>
              {loggedIn ? 'Log ud' : 'Log ind'}
            </button>
            <button className="button" onClick={handleCreateUser}>
              Opret bruger
            </button>
          </div>
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
