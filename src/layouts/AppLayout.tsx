import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import StorageNotice from '../components/ui/StorageNotice';
import { useAuthContext } from '../context/AuthContext';
import { useStorageRecovery } from '../hooks/useStorageRecovery';

function AppLayout() {
  const { user, logout } = useAuthContext();
  const recovered = useStorageRecovery();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="header-inner">
          <div className="brand-group" style={{ gap: '2px' }}>
            <h1 className="brand" style={{ marginBottom: '2px' }}>
              Routine <span className="brand-accent">Tracker</span>
            </h1>
            <p className="brand-subtitle">Plan your week, keep momentum, and build consistency.</p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="mobile-menu-toggle"
              aria-expanded={menuOpen}
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span className="hamburger-icon" />
            </button>

            <nav className={menuOpen ? 'nav-links nav-open' : 'nav-links'}>
              <NavLink onClick={() => setMenuOpen(false)} to="/" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>Dashboard</NavLink>
              <NavLink onClick={() => setMenuOpen(false)} to="/routine" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>Routine</NavLink>
              <NavLink onClick={() => setMenuOpen(false)} to="/history" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>History</NavLink>
              <button type="button" onClick={() => { logout(); setMenuOpen(false); }} className="nav-link nav-logout">Logout</button>
            </nav>

            <button onClick={() => logout()} className="button button-secondary desktop-logout">Logout</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <StorageNotice recovered={recovered} />
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <p className="meta-label">Signed in as</p>
              <strong>{user?.email ?? 'Unknown user'}</strong>
            </div>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
