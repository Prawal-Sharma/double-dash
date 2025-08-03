import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('jwt');

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    navigate('/');
  };

  const navStyle = {
    display: 'flex',
    padding: '10px 20px',
    backgroundColor: '#333',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    color: '#fff',
    fontSize: '1.5em',
    fontWeight: 'bold',
    textDecoration: 'none',
  };

  const linkContainer = {
    display: 'flex',
    gap: '20px',
  };

  const linkStyle = {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '1em',
    fontWeight: 'bold',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'background-color 0.3s ease',
  };

  const linkHover = {
    backgroundColor: '#555',
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={titleStyle}>Double Dash</Link>
      <div style={linkContainer}>
        <Link
          to="/"
          style={linkStyle}
          onMouseEnter={(e) => Object.assign((e.target as HTMLElement).style, linkHover)}
          onMouseLeave={(e) => Object.assign((e.target as HTMLElement).style, { backgroundColor: 'transparent' })}
        >
          Home
        </Link>
        {token && (
          <Link
            to="/exchange_token"
            style={linkStyle}
            onMouseEnter={(e) => Object.assign((e.target as HTMLElement).style, linkHover)}
            onMouseLeave={(e) => Object.assign((e.target as HTMLElement).style, { backgroundColor: 'transparent' })}
          >
            Dashboard
          </Link>
        )}
        {!token && (
          <>
            <Link
              to="/login"
              style={linkStyle}
              onMouseEnter={(e) => Object.assign((e.target as HTMLElement).style, linkHover)}
              onMouseLeave={(e) => Object.assign((e.target as HTMLElement).style, { backgroundColor: 'transparent' })}
            >
              Login
            </Link>
            <Link
              to="/register"
              style={linkStyle}
              onMouseEnter={(e) => Object.assign((e.target as HTMLElement).style, linkHover)}
              onMouseLeave={(e) => Object.assign((e.target as HTMLElement).style, { backgroundColor: 'transparent' })}
            >
              Register
            </Link>
          </>
        )}
        {token && (
          <button
            onClick={handleLogout}
            style={{
              ...linkStyle,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => Object.assign((e.target as HTMLElement).style, linkHover)}
            onMouseLeave={(e) => Object.assign((e.target as HTMLElement).style, { backgroundColor: 'transparent' })}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 