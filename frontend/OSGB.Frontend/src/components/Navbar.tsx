import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Function to determine if a link is active
  const isActive = (path: string) => {
    // Special case for the dashboard (root path)
    if (path === '/' && location.pathname === '/') return true;
    // For other paths, check if the current path starts with the link path
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    // Special handling for root path
    if (path === '/' && location.pathname !== '/') return false;
    return false;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">OSGB Sistemi</Link>
      </div>
      
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Kontrol Paneli</Link>
        </li>
        <li className="nav-item">
          <Link to="/experts" className={`nav-link ${isActive('/experts') ? 'active' : ''}`}>Uzmanlar</Link>
        </li>
        <li className="nav-item">
          <Link to="/doctors" className={`nav-link ${isActive('/doctors') ? 'active' : ''}`}>Hekimler</Link>
        </li>
        <li className="nav-item">
          <Link to="/dsps" className={`nav-link ${isActive('/dsps') ? 'active' : ''}`}>DSP'ler</Link>
        </li>
        <li className="nav-item">
          <Link to="/workplaces" className={`nav-link ${isActive('/workplaces') ? 'active' : ''}`}>İş Yerleri</Link>
        </li>
        <li className="nav-item">
          <Link to="/visits" className={`nav-link ${isActive('/visits') ? 'active' : ''}`}>Ziyaretler</Link>
        </li>
        {user?.role === 'admin' && (
          <li className="nav-item">
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>Admin Panel</Link>
          </li>
        )}
      </ul>
      
      <div className="navbar-user">
        {user && (
          <>
            <Link to="/profile" className="user-profile-link">
              <span className="user-name">{user.fullName}</span>
            </Link>
            <button className="logout-button" onClick={handleLogout}>
              Çıkış Yap
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;