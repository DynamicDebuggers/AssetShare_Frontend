import { NavLink, Outlet } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__dot" />
          <span>AssetShare</span>
        </div>
        <nav className="nav">
          <NavLink className={({ isActive }) => `nav__link${isActive ? ' active' : ''}`} to="/">
            Home
          </NavLink>
          <NavLink className={({ isActive }) => `nav__link${isActive ? ' active' : ''}`} to="/booking">
            Booking
          </NavLink>
          <NavLink className={({ isActive }) => `nav__link${isActive ? ' active' : ''}`} to="/listing">
            Listing
          </NavLink>
          <NavLink className={({ isActive }) => `nav__link${isActive ? ' active' : ''}`} to="/machine">
            Machine
          </NavLink>
          <NavLink className={({ isActive }) => `nav__link${isActive ? ' active' : ''}`} to="/user">
            User
          </NavLink>
        </nav>
      </aside>

      <div className="main-area">
        <main className="content">
          <Outlet />
        </main>

        <footer className="footer">
          <span>AssetShare API Console</span>
          <span>Powered by Vite + React</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
