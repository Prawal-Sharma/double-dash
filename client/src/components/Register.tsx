import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { AuthResponse, ApiError } from '../types';

const Register: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const navigate = useNavigate();

  // Get clientID from environment variable
  const clientID = process.env.REACT_APP_STRAVA_CLIENT_ID;
  
  if (!clientID) {
    console.error('REACT_APP_STRAVA_CLIENT_ID environment variable is not set');
  }
  
  const redirectURI = `${config.FRONTEND_URL}/exchange_token`;
  const scope = 'read,activity:read';
  const stravaAuthURL = `https://www.strava.com/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&approval_prompt=force&scope=${scope}`;

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // First, register the user
      const registerResponse = await axios.post<AuthResponse>(`${config.API_BASE_URL}/register`, { email, password });

      if (registerResponse.data.message === 'User registered successfully') {
        setSuccess('User registered! Connecting to Strava...');

        // Next, automatically login to get JWT
        const loginResponse = await axios.post<AuthResponse>(`${config.API_BASE_URL}/login`, { email, password });
        const { token } = loginResponse.data;
        // Store JWT in localStorage
        localStorage.setItem('jwt', token);

        // Redirect them immediately to Strava's Auth page
        window.location.href = stravaAuthURL;
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('Error registering user, maybe already exists or invalid data.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Register</h2>
      {error && <p style={{ color:'red' }}>{error}</p>}
      {success && <p style={{ color:'green' }}>{success}</p>}
      <form onSubmit={handleRegister} style={{ display:'inline-block', textAlign:'left' }}>
        <div style={{ marginBottom:'10px' }}>
          <label>Email: </label>
          <input 
            type="email" 
            value={email}
            onChange={e => {
              setEmail(e.target.value);
            }}
            required
          />
        </div>
        <div style={{ marginBottom:'10px' }}>
          <label>Password: </label>
          <input 
            type="password" 
            value={password}
            onChange={e => {
              setPassword(e.target.value);
            }}
            required
          />
        </div>
        <button type="submit">Register & Connect Strava</button>
      </form>
    </div>
  );
};

export default Register;
