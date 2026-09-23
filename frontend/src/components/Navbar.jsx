import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/">NallaBid</Link>
      {user?.role === ROLES.BUYER && <Link to="/buyer/dashboard">Dashboard</Link>}
      {user?.role === ROLES.SUPPLIER && <Link to="/supplier/dashboard">Dashboard</Link>}
      {user ? (
        <button onClick={handleLogout}>Logout</button>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}
