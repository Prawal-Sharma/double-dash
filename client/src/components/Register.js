import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Adjust clientID, redirectURI, and scope for Strava
  const clientID = '136786'; 
  const redirectURI = 'http://localhost:3000/exchange_token';
  const scope = 'read,activity:read';
  const stravaAuthURL = `http://www.strava.com/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&approval_prompt=force&scope=${scope}`;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    console.log('Register form submitted with email:', email);

    try {
      // First, register the user
      console.log('Attempting to register user...');
      const registerResponse = await axios.post('http://localhost:3001/register', { email, password });
      console.log('Register response:', registerResponse.data);

      if (registerResponse.data.message === 'User registered successfully') {
        setSuccess('User registered! Connecting to Strava...');
        console.log('User registered successfully. Proceeding to login...');

        // Next, automatically login to get JWT
        const loginResponse = await axios.post('http://localhost:3001/login', { email, password });
        console.log('Login response:', loginResponse.data);
        const { token } = loginResponse.data;
        // Store JWT in localStorage
        localStorage.setItem('jwt', token);
        console.log('JWT stored in localStorage:', token);

        // Redirect them immediately to Strava's Auth page
        console.log('Redirecting to Strava Auth URL:', stravaAuthURL);
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
              console.log('Email input changed:', e.target.value);
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
              console.log('Password input changed:', e.target.value);
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
