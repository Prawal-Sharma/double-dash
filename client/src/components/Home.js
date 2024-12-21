import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const clientID = '136786'; // Or use process.env.REACT_APP_STRAVA_CLIENT_ID
  const redirectURI = 'http://localhost:3000/exchange_token';
  const scope = 'read,activity:read';
  const stravaAuthURL = `http://www.strava.com/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&approval_prompt=force&scope=${scope}`;

  const token = localStorage.getItem('jwt');

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    navigate('/');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to Double Dash</h1>
      {!token && (
        <>
          <p>
            <Link to="/login"><button>Login</button></Link>
          </p>
          <p>
            <Link to="/register"><button>Register</button></Link>
          </p>
          <p>Please login or register before connecting Strava.</p>
        </>
      )}

      {token && (
        <>
          <p>You are logged in. You can view your <Link to="/exchange_token">Dashboard</Link> if you have activities.</p>
          <p>Or connect your Strava account if you haven't already:</p>
          <a href={stravaAuthURL}>
            <button>Connect with Strava</button>
          </a>
          <div style={{ marginTop: '20px' }}>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
