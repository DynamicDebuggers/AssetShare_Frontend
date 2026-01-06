import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  clearStoredToken,
  getStoredToken,
  isStoredTokenExpired,
  logoutUser,
  validateSession,
} from './api/client';
import './App.css';

function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getStoredToken()));
  const navigate = useNavigate();
  const location = useLocation();
  const isListingsRoute = location.pathname.startsWith('/listings');

  useEffect(() => {
    if (isStoredTokenExpired()) {
      clearStoredToken();
      setLoggedIn(false);
      return;
    }
    setLoggedIn(Boolean(getStoredToken()));
  }, [location.pathname]);

  useEffect(() => {
    function handleStorage() {
      if (isStoredTokenExpired()) {
        clearStoredToken();
        setLoggedIn(false);
        return;
      }
      setLoggedIn(Boolean(getStoredToken()));
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const result = await validateSession();
      if (active) {
        setLoggedIn(result.ok);
      }
    }

    if (getStoredToken()) {
      checkSession();
    }

    return () => {
      active = false;
    };
  }, []);

  function handleLogin() {
    navigate('/login');
  }

  async function handleLogout() {
    const { error } = await logoutUser();
    if (error) {
      clearStoredToken();
    }
    setLoggedIn(false);
    navigate('/');
  }

  function handleProfile() {
    navigate('/user');
  }

  function handleListings() {
    navigate('/listings');
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
          {loggedIn ? (
            <>
              <NavLink
                className={({ isActive }) => `nav__link${isActive ? ' active' : ''}`}
                to="/listings"
                end
              >
                Se annoncer
              </NavLink>
              <NavLink
                className={({ isActive }) => `nav__link${isActive ? ' active' : ''}`}
                to="/listings/new"
              >
                Opret annonce
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="auth-card">
          <div className="auth-card__text">
            <strong>{authLabel}</strong>
            <span className="muted">{authHelper}</span>
          </div>
          <div className="auth-card__actions">
            {loggedIn ? (
              <>
                <button className="button" onClick={handleProfile}>
                  Profil
                </button>
                <button className="button" onClick={handleLogout}>
                  Log ud
                </button>
              </>
            ) : (
              <>
                <button className="button" onClick={handleLogin}>
                  Log ind
                </button>
                <button className="button" onClick={handleCreateUser}>
                  Opret bruger
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <div className="main-area">
        <main className={`content${isListingsRoute ? ' content--listings' : ''}`}>
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
