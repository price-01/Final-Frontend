import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { getUserRoleLabel } from '../utils/uiText';

export interface NavbarProps {
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title = 'Rental Mobil' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      navigate('/login');
    } catch (err) {
      console.error('Gagal keluar:', err);
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="navbar-brand-name">{title}</span>
        </Link>

        <button
          type="button"
          className="navbar-hamburger"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Buka atau tutup menu navigasi"
          aria-expanded={isOpen}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <nav className={`navbar-nav ${isOpen ? 'open' : ''}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={closeMenu}
          >
            Beranda
          </NavLink>
          <NavLink
            to="/cars"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={closeMenu}
          >
            Cari Mobil
          </NavLink>
          <NavLink
            to="/bookings"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={closeMenu}
          >
            Pesanan
          </NavLink>
          <NavLink
            to="/assistant"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={closeMenu}
          >
            ✨ Asisten AI
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={closeMenu}
            >
              Panel Admin
            </NavLink>
          )}

          <div className="navbar-auth-buttons">
            {isAuthenticated && user ? (
              <div className="navbar-user-section">
                <span className="navbar-user-greeting">
                  Halo, <strong>{user.name || user.email.split('@')[0]}</strong>
                  <span className={`navbar-role-pill ${user.role}`}>
                    {getUserRoleLabel(user.role)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary navbar-logout-btn"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary" onClick={closeMenu}>
                  Masuk
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
                  Daftar
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
