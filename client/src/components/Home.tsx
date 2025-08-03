import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('jwt');

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    navigate('/');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <h1 style={{ fontSize: '2.5em', marginBottom: '20px' }}>Welcome to Double Dash</h1>
      {!token && (
        <>
          <p>
            <Link to="/login">
              <button style={{ padding: '10px 20px', fontSize: '1em', margin: '10px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#f0f0f0' }}>
                Login
              </button>
            </Link>
          </p>
          <p>
            <Link to="/register">
              <button style={{ padding: '10px 20px', fontSize: '1em', margin: '10px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#f0f0f0' }}>
                Register
              </button>
            </Link>
          </p>
          <p style={{ fontSize: '1.1em', color: '#666' }}>Please login or register before proceeding.</p>
        </>
      )}

      {token && (
        <>
          <p style={{ fontSize: '1.2em', marginBottom: '20px' }}>
            You are logged in. You can view your <Link to="/exchange_token" style={{ color: '#007bff', textDecoration: 'none' }}>Dashboard</Link> if you have activities.
          </p>
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={handleLogout}
              style={{ padding: '10px 20px', fontSize: '1em', cursor: 'pointer', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#f0f0f0' }}
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
