import React from 'react';

const Home = () => {
  const clientID = process.env.REACT_APP_STRAVA_CLIENT_ID;
  const redirectURI = 'http://localhost:3000/exchange_token';
  const scope = 'read,activity:read';

  const stravaAuthURL = `http://www.strava.com/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&approval_prompt=force&scope=${scope}`;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to Double Dash</h1>
      <a href={stravaAuthURL}>
        <button>Connect with Strava</button>
      </a>
    </div>
  );
};

export default Home;
